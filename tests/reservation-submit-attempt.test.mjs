import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { clearAttempt, loadOrCreateAttempt } from '../src/reservation/attempt-session.mjs';
import { submitPreparedAttempt } from '../src/reservation/submit-attempt.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('제출 전에 복구 정보를 보존하고 임의의 요청 키를 덮어쓴다', async () => {
  const storage = memoryStorage();
  let sent;
  const response = await submitPreparedAttempt('fixture', { eventId: 'fixture', idempotencyKey: 'forged', recoveryToken: 'forged' }, storage, webcrypto, async (payload) => { sent = payload; assert.throws(() => clearAttempt('fixture', storage)); return 'received'; });
  assert.equal(response, 'received');
  assert.deepEqual({ idempotencyKey: sent.idempotencyKey, recoveryToken: sent.recoveryToken }, loadOrCreateAttempt('fixture', storage, webcrypto));
  assert.notEqual(sent.idempotencyKey, 'forged');
  assert.notEqual(sent.recoveryToken, 'forged');
});

test('전송 실패 후 재전송을 차단하고 같은 복구 정보를 유지한다', async () => {
  const storage = memoryStorage();
  let previous;
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async (payload) => { previous = payload; throw new Error('offline'); }));
  let retries = 0;
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { retries++; }), /status must be checked/);
  assert.equal(retries, 0);
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), { idempotencyKey: previous.idempotencyKey, recoveryToken: previous.recoveryToken });
  assert.throws(() => clearAttempt('fixture', storage));
});

test('전송 상태 저장이 실패하거나 행사 정보가 다르면 전송하지 않는다', async () => {
  const base = memoryStorage();
  const storage = { ...base, setItem: (key, value) => { if (JSON.parse(value).phase === 'submitted') throw new Error('storage unavailable'); base.setItem(key, value); } };
  let calls = 0;
  const submit = async () => { calls++; };
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, submit));
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'other' }, base, webcrypto, submit));
  assert.equal(calls, 0);
});

test('기존 준비 상태의 식별자가 같으면 전송하지 않는다', async () => {
  const storage = memoryStorage();
  const key = 'riorio.reservation.attempt.v1.fixture';
  const raw = JSON.stringify({ idempotencyKey: 'a'.repeat(43), recoveryToken: 'a'.repeat(43), phase: 'prepared' });
  storage.setItem(key, raw);
  let calls = 0;
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { calls++; }), /independent/);
  assert.equal(calls, 0);
  assert.equal(storage.getItem(key), raw);
});

test('같은 세션의 동시 제출은 한 번만 전송하고 완료 후 재전송을 차단한다', async () => {
  const storage = memoryStorage();
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const submit = async () => { calls++; await pending; return 'received'; };
  const first = submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, submit);
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, submit), /already in progress/);
  assert.equal(calls, 1);
  release();
  assert.equal(await first, 'received');
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => 'retry'), /status must be checked/);
});

test('전송 오류 뒤에도 재전송을 차단하고 복구 정보는 보존한다', async () => {
  const storage = memoryStorage();
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { throw new Error('offline'); }));
  await assert.rejects(submitPreparedAttempt('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => 'retry'), /status must be checked/);
  assert.throws(() => clearAttempt('fixture', storage));
});
