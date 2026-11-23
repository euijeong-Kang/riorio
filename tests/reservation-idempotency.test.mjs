import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalReservationRequest, resolveIdempotency } from '../src/reservation/idempotency.mjs';
import { issueRecoveryToken, recoveryTokenDigest } from '../src/reservation/recovery-token.mjs';

const request = { eventId: 'test-event', slotId: 'test-slot', guests: 2, pairingGuests: 1, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1' };

test('같은 요청을 일관되게 정규화하며 가격 입력은 포함하지 않는다', () => {
  assert.equal(canonicalReservationRequest(request), canonicalReservationRequest({ ...request, name: ' 가상 고객 ', phone: '01000000000', price: 1 }));
  assert.notEqual(canonicalReservationRequest(request), canonicalReservationRequest({ ...request, pairingGuests: 2 }));
  assert.notEqual(canonicalReservationRequest(request), canonicalReservationRequest({ ...request, requests: 'test' }));
  assert.notEqual(canonicalReservationRequest(request), canonicalReservationRequest({ ...request, expectedCoursePrice: 2000 }));
  assert.notEqual(canonicalReservationRequest(request), canonicalReservationRequest({ ...request, expectedDepositVersion: 'deposit-v2' }));
  assert.throws(() => canonicalReservationRequest({ ...request, guests: '2' }));
});

test('새 요청, 응답 재전송, 처리 중, 다른 내용의 키 충돌을 구분한다', () => {
  const secret = Buffer.alloc(32, 7);
  const token = issueRecoveryToken();
  const proof = { token, secret, now: new Date('2026-01-01T00:00:00Z') };
  const existing = { fingerprint: 'hash-a', state: 'complete', reservationId: 'test-id', recoveryDigest: recoveryTokenDigest(token, secret), expiresAt: new Date('2026-01-02T00:00:00Z'), revoked: false };
  assert.deepEqual(resolveIdempotency(null, 'hash-a'), { action: 'create' });
  assert.deepEqual(resolveIdempotency(existing, 'hash-a', proof), { action: 'replay', reservationId: 'test-id' });
  assert.deepEqual(resolveIdempotency({ ...existing, state: 'pending' }, 'hash-a', proof), { action: 'pending' });
  assert.deepEqual(resolveIdempotency(existing, 'hash-b', proof), { action: 'conflict' });
  assert.deepEqual(resolveIdempotency(existing, 'hash-a'), { action: 'unavailable' });
  assert.deepEqual(resolveIdempotency(existing, 'hash-b', { ...proof, token: issueRecoveryToken() }), { action: 'unavailable' });
  assert.deepEqual(resolveIdempotency({ ...existing, revoked: true }, 'hash-a', proof), { action: 'unavailable' });
  assert.deepEqual(resolveIdempotency({ ...existing, expiresAt: proof.now }, 'hash-a', proof), { action: 'unavailable' });
  assert.throws(() => resolveIdempotency(null, ''));
});
