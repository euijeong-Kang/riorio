import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { clearAttempt } from '../src/reservation/attempt-session.mjs';
import { submitAndInterpret } from '../src/reservation/submit-and-interpret.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('가상 접수 응답을 해석하고 같은 시도의 재제출을 막는다', async () => {
  const storage = memoryStorage();
  let calls = 0;
  const submit = async () => { calls++; return Response.json({ status: 'received' }, { status: 202 }); };
  assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, submit), 'received');
  assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, submit), 'unavailable');
  assert.equal(calls, 1);
  assert.throws(() => clearAttempt('fixture', storage));
});

test('가상 전송 실패나 알 수 없는 응답 뒤에도 재제출하지 않는다', async () => {
  for (const submit of [async () => { throw new Error('offline'); }, async () => Response.json({ status: 'unexpected' }, { status: 202 })]) {
    const storage = memoryStorage();
    let retries = 0;
    assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, submit), 'unavailable');
    assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { retries++; }), 'unavailable');
    assert.equal(retries, 0);
    assert.throws(() => clearAttempt('fixture', storage));
  }
});

test('기존 신청 확인 필요 응답을 접수로 바꾸지 않는다', async () => {
  const storage = memoryStorage();
  const submit = async () => Response.json({ error: 'REQUEST_STATUS_REQUIRED' }, { status: 409 });
  assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, submit), 'status-required');
  assert.throws(() => clearAttempt('fixture', storage));
});

test('가상 응답이 멈추면 중단 신호와 확인 불가를 반환하고 재전송을 막는다', async () => {
  const storage = memoryStorage();
  let signal;
  let calls = 0;
  const result = await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, async (_body, requestSignal) => {
    calls++;
    signal = requestSignal;
    return new Promise(() => {});
  }, 20);
  assert.equal(result, 'unavailable');
  assert.equal(signal.aborted, true);
  assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { calls++; }), 'unavailable');
  assert.equal(calls, 1);
  assert.throws(() => clearAttempt('fixture', storage));
});

test('잘못된 제한 시간은 저장이나 전송 전에 거부한다', async () => {
  const storage = memoryStorage();
  let calls = 0;
  assert.equal(await submitAndInterpret('fixture', { eventId: 'fixture' }, storage, webcrypto, async () => { calls++; }, 0), 'unavailable');
  assert.equal(storage.getItem('riorio.reservation.attempt.v1.fixture'), null);
  assert.equal(calls, 0);
});
