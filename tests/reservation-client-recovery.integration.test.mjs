import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import { clearAttempt, loadOrCreateAttempt } from '../src/reservation/attempt-session.mjs';
import { submitPreparedAttempt } from '../src/reservation/submit-attempt.mjs';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';
import { recoverSubmittedAttempt } from '../src/reservation/recover-attempt.mjs';
import { interpretSubmissionResponse } from '../src/reservation/interpret-submission-response.mjs';

test('응답 유실과 조건 변경 뒤 같은 시도의 최소 상태를 복구한다', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const secret = randomBytes(32);
  const now = () => new Date('2026-01-01T12:00:00Z');
  let config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [2], coursePrice: 1000, pairingPrice: 300 };
  const payload = { eventId: 'fixture', slotId: 'slot', guests: 2, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1' };
  let record;
  let writes = 0;
  const dependencies = { checkRateLimit: async () => true, now, recoverySecret: secret, loadTrustedConfig: async () => config, createAtomically: async ({ recoveryDigest }) => { if (record) return 'replay'; writes++; record = { digest: recoveryDigest, status: 'received', expiresAt: new Date('2026-01-03T00:00:00Z'), revoked: false }; return 'created'; } };
  const request = (body) => new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let firstAttempt;
  await assert.rejects(submitPreparedAttempt('fixture', payload, storage, webcrypto, async (body) => {
    firstAttempt = { idempotencyKey: body.idempotencyKey, recoveryToken: body.recoveryToken };
    assert.throws(() => clearAttempt('fixture', storage));
    assert.equal((await handleReservationHttp(request(body), dependencies)).status, 202);
    throw new Error('simulated response loss');
  }));
  config = { ...config, coursePrice: 2000 };
  let retries = 0;
  await assert.rejects(submitPreparedAttempt('fixture', payload, storage, webcrypto, async () => { retries++; }), /status must be checked/);
  assert.equal(retries, 0);
  assert.equal(writes, 1);
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), firstAttempt);
  assert.throws(() => clearAttempt('fixture', storage));

  const recoveryDependencies = { secret, now, checkRateLimit: async () => true, lookupByDigest: async (digest) => digest === record.digest ? record : null };
  const recover = (token) => new Request('http://localhost/recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) });
  const result = await recoverSubmittedAttempt('fixture', storage, async ({ token }) => handleRecoveryHttp(recover(token), recoveryDependencies));
  assert.deepEqual(result, { status: 'received' });
  assert.equal((await handleRecoveryHttp(recover(issueRecoveryToken()), recoveryDependencies)).status, 404);

  for (const status of ['confirmed', 'cancelled']) {
    record.status = status;
    assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, async ({ token }) => handleRecoveryHttp(recover(token), recoveryDependencies)), { status });
    assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), firstAttempt);
    await assert.rejects(submitPreparedAttempt('fixture', payload, storage, webcrypto, async () => { retries++; }), /status must be checked/);
  }

  config = { ...config, coursePrice: 1000 };
  const replay = await handleReservationHttp(request({ ...payload, ...firstAttempt }), dependencies);
  assert.equal(replay.status, 409);
  assert.equal(await interpretSubmissionResponse(replay.clone()), 'status-required');
  assert.deepEqual(await replay.json(), { error: 'REQUEST_STATUS_REQUIRED' });
  assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, async ({ token }) => handleRecoveryHttp(recover(token), recoveryDependencies)), { status: 'cancelled' });

  record.revoked = true;
  assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, async ({ token }) => handleRecoveryHttp(recover(token), recoveryDependencies)), { status: 'unavailable' });
  assert.deepEqual(loadOrCreateAttempt('fixture', storage, webcrypto), firstAttempt);
  assert.throws(() => clearAttempt('fixture', storage));
  await assert.rejects(submitPreparedAttempt('fixture', payload, storage, webcrypto, async () => { retries++; }), /status must be checked/);
  assert.equal(retries, 0);
  assert.equal(writes, 1);
});
