import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';

const config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 10, minimumGuests: 2, allowedGuestCounts: [2, 3, 4], coursePrice: 1000, pairingPrice: 300 };
const body = { eventId: 'fixture', slotId: 'slot', guests: 2, pairingGuests: 1, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: 'fixture-request-0001', recoveryToken: issueRecoveryToken() };
const dependencies = { checkRateLimit: async () => true, now: () => new Date('2026-01-01T12:00:00Z'), recoverySecret: Buffer.alloc(32, 7), loadTrustedConfig: async () => config, createAtomically: async () => 'created' };
const request = (value, options = {}) => new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: value, ...options });

test('닫힌 상태와 비정상 HTTP 요청을 거부한다', async () => {
  assert.equal((await handleReservationHttp(request('{}'), null)).status, 503);
  assert.equal((await handleReservationHttp(new Request('http://localhost/reservation'), dependencies)).status, 405);
  assert.equal((await handleReservationHttp(request('{}', { headers: { 'content-type': 'text/plain' } }), dependencies)).status, 415);
  assert.equal((await handleReservationHttp(request('{'), dependencies)).status, 400);
  assert.equal((await handleReservationHttp(request('x'.repeat(8193)), dependencies)).status, 413);
});

test('가상 접수 응답은 캐시하지 않으며 개인정보를 반환하지 않는다', async () => {
  const response = await handleReservationHttp(request(JSON.stringify(body)), dependencies);
  const result = await response.text();
  assert.equal(response.status, 202);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(JSON.parse(result), { status: 'received' });
  assert.equal(result.includes(body.phone), false);
  assert.equal(result.includes(body.name), false);
});

test('요청 제한 누락·초과·장애 시 설정 조회와 예약 저장 없이 차단한다', async () => {
  let calls = 0;
  const guarded = { ...dependencies, loadTrustedConfig: async () => { calls++; return config; }, createAtomically: async () => { calls++; return 'created'; } };
  for (const [checkRateLimit, expected] of [[undefined, 503], [async () => false, 429], [async () => { throw new Error('offline'); }, 503], [async () => 'allowed', 429]]) {
    const response = await handleReservationHttp(request(JSON.stringify(body)), { ...guarded, checkRateLimit });
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'BOOKING_UNAVAILABLE' });
  }
  assert.equal(calls, 0);
});

test('실제 수신 크기가 제한을 넘으면 입력 스트림을 취소하고 저장하지 않는다', async () => {
  let cancelled = false;
  let calls = 0;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(8193)); },
    cancel() { cancelled = true; },
  });
  const streamedRequest = new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' });
  const response = await handleReservationHttp(streamedRequest, { ...dependencies, createAtomically: async () => { calls++; return 'created'; } });
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
  assert.equal(calls, 0);
});
