import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReservationService } from '../src/reservation/create-reservation-service.mjs';
import { issueRecoveryToken, recoveryTokenDigest } from '../src/reservation/recovery-token.mjs';

const recoverySecret = Buffer.alloc(32, 7);

const config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 10, minimumGuests: 2, allowedGuestCounts: [2, 3, 4], coursePrice: 1000, pairingPrice: 300 };
const request = { eventId: 'fixture', slotId: 'slot', guests: 2, pairingGuests: 1, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: 'fixture-request-0001', recoveryToken: issueRecoveryToken(), total: 1 };
const now = () => new Date('2026-01-01T12:00:00Z');

test('설정이 없거나 닫힌 경우 저장을 호출하지 않는다', async () => {
  let calls = 0;
  const createAtomically = async () => { calls++; return 'created'; };
  assert.equal((await createReservationService(request, null)).status, 503);
  assert.equal((await createReservationService(request, { now, createAtomically, loadTrustedConfig: async () => ({ ...config, status: 'draft' }) })).body.error, 'BOOKING_CLOSED');
  assert.equal(calls, 0);
});

test('가격이 없거나 허용 인원이 정원을 넘는 설정은 접수하지 않는다', async () => {
  let calls = 0;
  for (const invalidConfig of [{ ...config, coursePrice: undefined }, { ...config, pairingPrice: undefined }, { ...config, capacity: 2 }, { ...config, priceApproved: false }, { ...config, priceApproved: undefined }]) {
    const dependencies = { now, recoverySecret, loadTrustedConfig: async () => invalidConfig, createAtomically: async () => { calls++; return 'created'; } };
    assert.deepEqual(await createReservationService(request, dependencies), { status: 503, body: { error: 'BOOKING_CLOSED' } });
  }
  assert.equal(calls, 0);
});

test('저장 모형에서 가격 승인 철회를 재검증하면 이전 설정으로 접수하지 않는다', async () => {
  let trusted = { ...config };
  let writes = 0;
  const dependencies = {
    now,
    recoverySecret,
    loadTrustedConfig: async () => {
      const snapshot = { ...trusted };
      trusted = { ...trusted, priceApproved: false };
      return snapshot;
    },
    createAtomically: async () => {
      if (trusted.priceApproved !== true) return 'closed';
      writes++;
      return 'created';
    },
  };
  assert.deepEqual(await createReservationService(request, dependencies), { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } });
  assert.equal(writes, 0);
});

test('잘못된 행사·회차 식별자는 설정 조회 전에 거부한다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => { calls++; return config; }, createAtomically: async () => { calls++; return 'created'; } };
  for (const invalid of [null, { ...request, eventId: '../bad' }, { ...request, slotId: {} }, { ...request, slotId: 'a'.repeat(81) }, { ...request, eventId: '' }]) {
    assert.deepEqual(await createReservationService(invalid, dependencies), { status: 400, body: { error: 'INVALID_SLOT' } });
  }
  assert.equal(calls, 0);
});

test('서버 가격을 전달하고 접수와 확정을 구분한다', async () => {
  let receivedTotal;
  const result = await createReservationService(request, { now, recoverySecret, loadTrustedConfig: async () => config, createAtomically: async (input) => { receivedTotal = input.total; assert.equal(input.recoveryDigest, recoveryTokenDigest(request.recoveryToken, recoverySecret)); assert.equal('recoveryToken' in input.request, false); assert.equal('total' in input.request, false); return 'created'; } });
  assert.equal(receivedTotal, 2300);
  assert.deepEqual(result, { status: 202, body: { status: 'received' } });
});

test('인원별 예약금이 일치하지 않으면 저장하지 않는다', async () => {
  let calls = 0;
  const approved = { ...config, coursePrice: 120000, pairingPrice: 40000, depositPerGuest: 30000 };
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => approved, createAtomically: async ({ request: value }) => { calls++; assert.equal(value.expectedDeposit, value.guests * 30000); return 'created'; } };
  for (const guests of [2, 3, 4]) {
    const input = { ...request, guests, pairingGuests: 0, expectedCoursePrice: 120000, expectedPairingPrice: 40000, expectedDeposit: guests * 30000 };
    assert.equal((await createReservationService({ ...input, expectedDeposit: 30000 }, dependencies)).body.error, 'DEPOSIT_CHANGED');
    assert.equal((await createReservationService(input, dependencies)).status, 202);
  }
  assert.equal(calls, 3);
});

test('정규화된 요청의 서버 지문은 일관되며 원문을 노출하지 않는다', async () => {
  const fingerprints = [];
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => config, createAtomically: async ({ fingerprint }) => { fingerprints.push(fingerprint); return 'created'; } };
  await createReservationService(request, dependencies);
  await createReservationService({ ...request, name: ` ${request.name} `, phone: '01000000000' }, dependencies);
  await createReservationService({ ...request, name: '다른 가상 고객' }, dependencies);
  assert.match(fingerprints[0], /^[a-f0-9]{64}$/);
  assert.equal(fingerprints[0], fingerprints[1]);
  assert.notEqual(fingerprints[0], fingerprints[2]);
  assert.equal(fingerprints[0].includes(request.phone), false);
  assert.equal(fingerprints[0].includes(request.name), false);
});

test('재전송, 충돌, 마감과 내부 오류를 안전하게 구분한다', async () => {
  const invoke = (createAtomically) => createReservationService(request, { now, recoverySecret, loadTrustedConfig: async () => config, createAtomically });
  assert.deepEqual(await invoke(async () => 'replay'), { status: 409, body: { error: 'REQUEST_STATUS_REQUIRED' } });
  assert.deepEqual(await invoke(async () => 'conflict'), { status: 409, body: { error: 'REQUEST_CONFLICT' } });
  assert.deepEqual(await invoke(async () => 'sold_out'), { status: 409, body: { error: 'SOLD_OUT' } });
  assert.deepEqual(await invoke(async () => 'price_changed'), { status: 409, body: { error: 'PRICE_CHANGED' } });
  assert.deepEqual(await invoke(async () => 'deposit_changed'), { status: 409, body: { error: 'DEPOSIT_CHANGED' } });
  assert.deepEqual(await invoke(async () => 'terms_changed'), { status: 409, body: { error: 'TERMS_CHANGED' } });
  assert.deepEqual(await invoke(async () => 'terms_not_accepted'), { status: 400, body: { error: 'TERMS_NOT_ACCEPTED' } });
  assert.deepEqual(await invoke(async () => { throw new Error('private'); }), { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } });
});

test('복구 토큰 또는 서버 비밀값이 없으면 저장하지 않는다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => config, createAtomically: async () => { calls++; return 'created'; } };
  assert.equal((await createReservationService({ ...request, recoveryToken: '' }, dependencies)).body.error, 'INVALID_RECOVERY_TOKEN');
  assert.equal((await createReservationService({ ...request, idempotencyKey: request.recoveryToken }, dependencies)).body.error, 'INVALID_RECOVERY_TOKEN');
  assert.equal((await createReservationService(request, { ...dependencies, recoverySecret: undefined })).status, 503);
  assert.equal(calls, 0);
});

test('확인한 가격이 서버 가격과 다르면 저장을 호출하지 않는다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => ({ ...config, coursePrice: 2000 }), createAtomically: async () => { calls++; return 'created'; } };
  assert.deepEqual(await createReservationService(request, dependencies), { status: 409, body: { error: 'PRICE_CHANGED' } });
  assert.equal(calls, 0);
});

test('예약금이 식사 총액을 초과하면 저장하지 않는다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => ({ ...config, depositPerGuest: 1151 }), createAtomically: async () => { calls++; return 'created'; } };
  assert.deepEqual(await createReservationService({ ...request, expectedDeposit: 2302 }, dependencies), { status: 503, body: { error: 'BOOKING_CLOSED' } });
  assert.equal(calls, 0);
});

test('예약금 확정 여부가 누락되면 0원이라도 저장하지 않는다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => ({ ...config, depositConfirmed: undefined }), createAtomically: async () => { calls++; return 'created'; } };
  assert.deepEqual(await createReservationService(request, dependencies), { status: 503, body: { error: 'BOOKING_CLOSED' } });
  assert.equal(calls, 0);
});

test('승인되지 않은 약관과 동의 누락은 저장하지 않는다', async () => {
  let calls = 0;
  const dependencies = { now, recoverySecret, loadTrustedConfig: async () => config, createAtomically: async () => { calls++; return 'created'; } };
  assert.equal((await createReservationService({ ...request, termsAccepted: false }, dependencies)).body.error, 'TERMS_NOT_ACCEPTED');
  assert.equal((await createReservationService(request, { ...dependencies, loadTrustedConfig: async () => ({ ...config, termsApproved: false }) })).body.error, 'BOOKING_CLOSED');
  assert.equal(calls, 0);
});

test('조건 변경 거부는 이전 동일 요청의 미접수를 증명하지 않는다', async () => {
  for (const change of [{ coursePrice: 2000 }, { depositPerGuest: 250, depositVersion: 'deposit-v2' }, { termsVersion: 'v2' }]) {
    let saved = 0;
    let current = { ...config };
    const dependencies = { now, recoverySecret, loadTrustedConfig: async () => current, createAtomically: async () => { saved++; return 'created'; } };
    assert.equal((await createReservationService(request, dependencies)).status, 202);
    current = { ...current, ...change };
    assert.equal((await createReservationService(request, dependencies)).status, 409);
    assert.equal(saved, 1);
  }
});
