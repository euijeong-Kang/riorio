import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { clearAttempt, getAttemptPhase, loadOrCreateAttempt, markAttemptSubmitted } from '../src/reservation/attempt-session.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('가상 신청 전에 두 비밀값을 저장하고 새로고침 후 같은 값을 복원한다', () => {
  const storage = memoryStorage();
  const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
  assert.match(attempt.idempotencyKey, /^[A-Za-z0-9_-]{43}$/);
  assert.match(attempt.recoveryToken, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(attempt.idempotencyKey, attempt.recoveryToken);
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
  assert.notDeepEqual(loadOrCreateAttempt('other-fixture', storage, webcrypto), attempt);
  clearAttempt('fixture', storage);
  assert.notDeepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
});

test('안전한 저장이나 난수 생성이 불가능하면 신청 준비를 거부한다', () => {
  assert.throws(() => loadOrCreateAttempt('fixture', null, webcrypto));
  assert.throws(() => loadOrCreateAttempt('fixture', memoryStorage(), null));
  assert.throws(() => loadOrCreateAttempt('fixture', { getItem: () => null, setItem: () => {} }, webcrypto));
  assert.throws(() => loadOrCreateAttempt('fixture', { getItem: () => '{broken', setItem: () => {} }, webcrypto));
  assert.throws(() => loadOrCreateAttempt('../bad', memoryStorage(), webcrypto));
});

test('난수 생성기가 같은 값을 반환하면 저장하지 않는다', () => {
  const storage = memoryStorage();
  const brokenCrypto = { getRandomValues: (bytes) => bytes.fill(1) };
  assert.throws(() => loadOrCreateAttempt('fixture', storage, brokenCrypto), /independent attempt credentials/);
  assert.equal(getAttemptPhase('fixture', storage), 'missing');
});

test('전송 표시 후에는 복구 정보를 자동으로 지울 수 없다', () => {
  const storage = memoryStorage();
  assert.equal(getAttemptPhase('fixture', storage), 'missing');
  const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
  assert.equal(getAttemptPhase('fixture', storage), 'prepared');
  markAttemptSubmitted('fixture', storage);
  assert.equal(getAttemptPhase('fixture', storage), 'submitted');
  markAttemptSubmitted('fixture', storage);
  assert.throws(() => clearAttempt('fixture', storage));
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
});

test('상태가 없는 기존 자료와 손상된 자료는 삭제하지 않는다', () => {
  const storage = memoryStorage();
  const attempt = loadOrCreateAttempt('fixture', storage, webcrypto);
  const key = 'riorio.reservation.attempt.v1.fixture';
  storage.setItem(key, JSON.stringify(attempt));
  assert.equal(getAttemptPhase('fixture', storage), 'unknown');
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), attempt);
  assert.throws(() => markAttemptSubmitted('fixture', storage));
  assert.throws(() => clearAttempt('fixture', storage));
  storage.setItem(key, '{broken');
  assert.throws(() => clearAttempt('fixture', storage));
  assert.equal(storage.getItem(key), '{broken');
});

test('배열 등 문자열이 아닌 식별자는 손상된 상태로 보존한다', () => {
  const storage = memoryStorage();
  const key = 'riorio.reservation.attempt.v1.fixture';
  const raw = JSON.stringify({ idempotencyKey: ['a'.repeat(43)], recoveryToken: 'b'.repeat(43), phase: 'prepared' });
  storage.setItem(key, raw);
  assert.equal(getAttemptPhase('fixture', storage), 'unknown');
  assert.throws(() => markAttemptSubmitted('fixture', storage));
  assert.throws(() => clearAttempt('fixture', storage));
  assert.equal(storage.getItem(key), raw);
});

test('기존 준비 상태의 동일한 두 식별자는 제출하지 않지만 정보를 보존한다', () => {
  const storage = memoryStorage();
  const key = 'riorio.reservation.attempt.v1.fixture';
  const raw = JSON.stringify({ idempotencyKey: 'a'.repeat(43), recoveryToken: 'a'.repeat(43), phase: 'prepared' });
  storage.setItem(key, raw);
  assert.throws(() => markAttemptSubmitted('fixture', storage), /independent/);
  assert.equal(storage.getItem(key), raw);
});
