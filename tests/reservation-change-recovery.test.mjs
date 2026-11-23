import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';

for (const [change, expectedError] of [[{ coursePrice: 2000 }, 'PRICE_CHANGED'], [{ depositPerGuest: 250, depositVersion: 'deposit-v2' }, 'DEPOSIT_CHANGED'], [{ termsVersion: 'v2' }, 'TERMS_CHANGED'], [{ status: 'draft' }, 'BOOKING_CLOSED']]) test(`${expectedError} 이후에도 기존 접수는 별도 복구 경로로 확인한다`, async () => {
  const secret = randomBytes(32);
  const token = issueRecoveryToken();
  const now = () => new Date('2026-01-01T12:00:00Z');
  let config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [2], coursePrice: 1000, pairingPrice: 300 };
  const body = { eventId: 'fixture', slotId: 'slot', guests: 2, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: 'fixture-request-0001', recoveryToken: token };
  let record;
  let writes = 0;
  const createDependencies = { checkRateLimit: async () => true, now, recoverySecret: secret, loadTrustedConfig: async () => config, createAtomically: async ({ recoveryDigest }) => { writes++; record = { digest: recoveryDigest, status: 'received', expiresAt: new Date('2026-01-03T00:00:00Z'), revoked: false }; return 'created'; } };
  const submit = () => new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const initial = await handleReservationHttp(submit(), createDependencies);
  assert.equal(initial.status, 202);
  config = { ...config, ...change };
  const retry = await handleReservationHttp(submit(), createDependencies);
  assert.equal(retry.status, expectedError === 'BOOKING_CLOSED' ? 503 : 409);
  assert.deepEqual(await retry.json(), { error: expectedError });
  assert.equal(writes, 1);

  const recoveryDependencies = { secret, now, checkRateLimit: async () => true, lookupByDigest: async (digest) => digest === record.digest ? record : null };
  const recover = (value) => new Request('http://localhost/recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: value }) });
  const response = await handleRecoveryHttp(recover(token), recoveryDependencies);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'received' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await handleRecoveryHttp(recover(issueRecoveryToken()), recoveryDependencies)).status, 404);
});
