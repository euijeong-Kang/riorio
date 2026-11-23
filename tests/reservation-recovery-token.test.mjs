import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { issueRecoveryToken, recoveryTokenDigest, recoveryStatus, verifyRecoveryToken } from '../src/reservation/recovery-token.mjs';

test('서로 다른 비밀 토큰은 서로 다른 검증값을 생성한다', () => {
  const secret = randomBytes(32);
  const first = issueRecoveryToken();
  const second = issueRecoveryToken();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
  const digest = recoveryTokenDigest(first, secret);
  assert.equal(verifyRecoveryToken(first, digest, secret), true);
  assert.equal(verifyRecoveryToken(second, digest, secret), false);
  assert.equal(verifyRecoveryToken(first, digest, randomBytes(32)), false);
  assert.equal(verifyRecoveryToken('invalid', digest, secret), false);
  assert.throws(() => recoveryTokenDigest(first, Buffer.alloc(4)));
});

test('유효한 토큰에만 최소 상태를 반환하고 실패 응답을 통일한다', () => {
  const secret = randomBytes(32);
  const token = issueRecoveryToken();
  const digest = recoveryTokenDigest(token, secret);
  assert.deepEqual(recoveryStatus(token, digest, secret, 'received'), { status: 'received' });
  assert.deepEqual(recoveryStatus(token, digest, secret, 'confirmed'), { status: 'confirmed' });
  assert.deepEqual(recoveryStatus(issueRecoveryToken(), digest, secret, 'confirmed'), { error: 'RECOVERY_UNAVAILABLE' });
  assert.deepEqual(recoveryStatus(token, '', secret, 'confirmed'), { error: 'RECOVERY_UNAVAILABLE' });
  assert.deepEqual(recoveryStatus(token, digest, secret, 'unknown'), { error: 'RECOVERY_UNAVAILABLE' });
});
