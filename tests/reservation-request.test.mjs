import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReservationRequest } from '../src/reservation/request-validation.mjs';

const config = { status: 'booking_open', priceApproved: true, eventId: 'test-event', slotId: 'test-slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 10, minimumGuests: 2, allowedGuestCounts: [2, 3, 4], coursePrice: 1000, pairingPrice: 300 };
const request = { eventId: 'test-event', slotId: 'test-slot', guests: 2, pairingGuests: 1, name: '테스트', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: 'fixture-request-0001' };
const now = new Date('2026-01-01T12:00:00Z');

test('서버 설정 가격만 사용한다', () => {
  assert.deepEqual(validateReservationRequest({ ...request, total: 1 }, config, now), { ok: true, total: 2300 });
  assert.equal(validateReservationRequest({ ...request, expectedCoursePrice: 1 }, config, now).error, 'PRICE_CHANGED');
  assert.equal(validateReservationRequest({ ...request, expectedCoursePrice: undefined }, config, now).error, 'INVALID_PRICE_CONFIRMATION');
  assert.equal(validateReservationRequest({ ...request, expectedDeposit: 2302 }, { ...config, depositPerGuest: 1151 }, now).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest({ ...request, expectedDeposit: 2300 }, { ...config, depositPerGuest: 1150 }, now).ok, true);
  assert.equal(validateReservationRequest({ ...request, expectedDeposit: 1 }, config, now).error, 'DEPOSIT_CHANGED');
  assert.equal(validateReservationRequest({ ...request, expectedDepositVersion: 'old' }, config, now).error, 'DEPOSIT_CHANGED');
  assert.equal(validateReservationRequest({ ...request, expectedDeposit: undefined }, config, now).error, 'INVALID_DEPOSIT_CONFIRMATION');
});

test('예약금은 신뢰된 1인 금액과 방문 인원으로 계산한다', () => {
  const approved = { ...config, coursePrice: 120000, pairingPrice: 40000, depositPerGuest: 30000 };
  for (const guests of [2, 3, 4]) {
    const input = { ...request, guests, pairingGuests: 0, expectedCoursePrice: 120000, expectedPairingPrice: 40000, expectedDeposit: guests * 30000 };
    assert.deepEqual(validateReservationRequest(input, approved, now), { ok: true, total: guests * 120000 });
    assert.equal(validateReservationRequest({ ...input, expectedDeposit: 30000 }, approved, now).error, 'DEPOSIT_CHANGED');
  }
  assert.equal(validateReservationRequest({ ...request, expectedDeposit: 0 }, { ...config, depositPerGuest: Number.MAX_SAFE_INTEGER }, now).error, 'BOOKING_CLOSED');
});

test('닫힌 행사와 설정 미완료 및 접수 시간 밖 요청을 거부한다', () => {
  assert.equal(validateReservationRequest(request, { ...config, status: 'draft' }, now).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest(request, { ...config, depositPerGuest: null }, now).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest({ ...request, guests: 1 }, { ...config, allowedGuestCounts: [1, 2] }, now).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest({ ...request, guests: 1 }, { ...config, minimumGuests: 1, allowedGuestCounts: [1, 2] }, now).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest(request, config, config.closesAt).error, 'BOOKING_CLOSED');
  assert.equal(validateReservationRequest(request, { ...config, termsApproved: false }, now).error, 'BOOKING_CLOSED');
});

test('회차, 인원, 옵션, 고객 정보, 약관 및 요청 키를 검증한다', () => {
  for (const [change, error] of [[{ slotId: 'other' }, 'INVALID_SLOT'], [{ guests: 5 }, 'INVALID_GUESTS'], [{ guests: 1 }, 'INVALID_GUESTS'], [{ pairingGuests: 3 }, 'INVALID_PAIRING'], [{ phone: '123' }, 'INVALID_CUSTOMER'], [{ termsVersion: 'old' }, 'TERMS_CHANGED'], [{ idempotencyKey: 'short' }, 'INVALID_REQUEST_KEY']]) {
    assert.equal(validateReservationRequest({ ...request, ...change }, config, now).error, error);
  }
});

test('약관에 명시적으로 동의하지 않으면 접수를 거부한다', () => {
  for (const termsAccepted of [false, undefined, 'true']) assert.equal(validateReservationRequest({ ...request, termsAccepted }, config, now).error, 'TERMS_NOT_ACCEPTED');
});

test('선택 입력은 필수가 아니며 비정상적인 고객 정보는 거부한다', () => {
  assert.equal(validateReservationRequest(request, config, now).ok, true);
  for (const [change, error] of [
    [{ name: 'a'.repeat(81) }, 'INVALID_CUSTOMER'],
    [{ name: 'a\nb' }, 'INVALID_CUSTOMER'],
    [{ phone: ' '.repeat(33) }, 'INVALID_CUSTOMER'],
    [{ email: 'bad-address' }, 'INVALID_EMAIL'],
    [{ email: 'a'.repeat(255) }, 'INVALID_EMAIL'],
    [{ requests: 'a'.repeat(501) }, 'INVALID_REQUESTS'],
    [{ requests: {} }, 'INVALID_REQUESTS'],
  ]) assert.equal(validateReservationRequest({ ...request, ...change }, config, now).error, error);
  assert.equal(validateReservationRequest({ ...request, email: '', requests: '' }, config, now).ok, true);
});
