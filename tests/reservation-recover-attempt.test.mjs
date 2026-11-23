import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { clearAttempt, getAttemptPhase, loadOrCreateAttempt, markAttemptSubmitted } from '../src/reservation/attempt-session.mjs';
import { recoverSubmittedAttempt } from '../src/reservation/recover-attempt.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('준비 전이나 미전송 시에는 새 시도 생성 또는 복구 요청을 하지 않는다', async () => {
  const storage = memoryStorage();
  let calls = 0;
  const recover = async () => { calls++; };
  assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, recover), { status: 'unavailable' });
  assert.equal(getAttemptPhase('fixture', storage), 'missing');
  loadOrCreateAttempt('fixture', storage, webcrypto);
  assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, recover), { status: 'unavailable' });
  assert.equal(calls, 0);
});

test('전송된 가상 시도의 최소 상태만 반환하며 복구 정보를 보존한다', async () => {
  const storage = memoryStorage();
  const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
  markAttemptSubmitted('fixture', storage);
  for (const status of ['received', 'confirmed', 'cancelled']) {
    const result = await recoverSubmittedAttempt('fixture', storage, async (input) => {
      assert.deepEqual(input, { token: attempt.recoveryToken });
      return Response.json({ status });
    });
    assert.deepEqual(result, { status });
  }
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
  assert.throws(() => clearAttempt('fixture', storage));
});

test('복구 실패나 알 수 없는 응답은 미접수로 해석하지 않는다', async () => {
  const storage = memoryStorage();
  const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
  markAttemptSubmitted('fixture', storage);
  for (const recover of [async () => new Response(null, { status: 404 }), async () => new Response(null, { status: 429 }), async () => { throw new Error('offline'); }, async () => Response.json({ status: 'received', privateData: 'sample' }), async () => Response.json({ status: 'not_found' })]) {
    assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, recover), { status: 'unavailable' });
  }
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
  assert.throws(() => clearAttempt('fixture', storage));
});

test('복구 중 저장된 시도가 바뀌거나 사라지면 이전 상태를 표시하지 않는다', async () => {
  for (const replacement of ['changed', 'removed', 'prepared', 'broken']) {
    const storage = memoryStorage();
    const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
    markAttemptSubmitted('fixture', storage);
    const key = 'riorio.reservation.attempt.v1.fixture';
    const result = await recoverSubmittedAttempt('fixture', storage, async () => {
      if (replacement === 'removed') storage.removeItem(key);
      if (replacement === 'broken') storage.setItem(key, '{broken');
      if (replacement === 'changed') storage.setItem(key, JSON.stringify({ ...attempt, recoveryToken: 'a'.repeat(43), phase: 'submitted' }));
      if (replacement === 'prepared') storage.setItem(key, JSON.stringify({ ...attempt, phase: 'prepared' }));
      return Response.json({ status: 'confirmed' });
    });
    assert.deepEqual(result, { status: 'unavailable' });
  }
});

test('동일 시도의 복구 응답이 역순으로 도착하면 이전 결과는 무시한다', async () => {
  const storage = memoryStorage();
  loadOrCreateAttempt('fixture', storage, webcrypto);
  markAttemptSubmitted('fixture', storage);
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const first = recoverSubmittedAttempt('fixture', storage, async () => {
    await waiting;
    return Response.json({ status: 'received' });
  });
  const second = await recoverSubmittedAttempt('fixture', storage, async () => Response.json({ status: 'confirmed' }));
  release();
  assert.deepEqual(second, { status: 'confirmed' });
  assert.deepEqual(await first, { status: 'superseded' });
});

test('더 최근 복구가 실패해도 이전 요청의 늦은 성공은 표시하지 않는다', async () => {
  const storage = memoryStorage();
  loadOrCreateAttempt('fixture', storage, webcrypto);
  markAttemptSubmitted('fixture', storage);
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const first = recoverSubmittedAttempt('fixture', storage, async () => {
    await waiting;
    return Response.json({ status: 'received' });
  });
  assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, async () => new Response(null, { status: 404 })), { status: 'unavailable' });
  release();
  assert.deepEqual(await first, { status: 'superseded' });
});
