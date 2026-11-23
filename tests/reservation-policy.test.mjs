import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, calculateSlotTimes, calculateTransferDeadline, isBookingConfigured, selectTableCombination, DEFAULT_GUESTS, TRANSFER_DEADLINE_HOURS } from '../src/reservation/policy.mjs';

test('입금 기한은 신청 시각에서 정확히 12시간 뒤이며 날짜를 넘겨도 유지된다', () => {
  const received = new Date('2026-12-24T14:30:00Z');
  assert.equal(TRANSFER_DEADLINE_HOURS, 12);
  assert.equal(calculateTransferDeadline(received).toISOString(), '2026-12-25T02:30:00.000Z');
  assert.equal(received.toISOString(), '2026-12-24T14:30:00.000Z');
  assert.throws(() => calculateTransferDeadline(new Date('invalid')));
  assert.throws(() => calculateTransferDeadline('2026-12-24'));
  assert.throws(() => calculateTransferDeadline(new Date(8640000000000000)));
});

test('가상 회차의 식사와 정리 시간을 구분한다', () => {
  const times = calculateSlotTimes(new Date('2026-12-01T03:00:00Z'));
  assert.equal(times.diningEndsAt.toISOString(), '2026-12-01T04:40:00.000Z');
  assert.equal(times.clearingEndsAt.toISOString(), '2026-12-01T05:00:00.000Z');
  assert.throws(() => calculateSlotTimes(new Date('invalid')));
});

test('가상 상품 금액을 정수로 계산하고 잘못된 입력을 거부한다', () => {
  assert.equal(DEFAULT_GUESTS, 2);
  assert.equal(calculatePrice({ guests: 2, pairingGuests: 1, coursePrice: 1000, pairingPrice: 300 }), 2300);
  for (const guests of [0, 5, 1.5]) assert.throws(() => calculatePrice({ guests, pairingGuests: 0, coursePrice: 1000, pairingPrice: 300 }));
  assert.throws(() => calculatePrice({ guests: 2, pairingGuests: 3, coursePrice: 1000, pairingPrice: 300 }));
  assert.throws(() => calculatePrice({ guests: 2, pairingGuests: 0, coursePrice: 0.5, pairingPrice: 300 }));
});

test('필수 정책이 없거나 닫힌 설정은 준비되지 않은 상태다', () => {
  const fixture = { status: 'booking_open', priceApproved: true, eventId: 'test', slotId: 'test-slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'test', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', coursePrice: 1000, pairingPrice: 300, capacity: 10, minimumGuests: 2, allowedGuestCounts: [2, 3, 4] };
  assert.equal(isBookingConfigured(fixture), true);
  assert.equal(isBookingConfigured({ ...fixture, status: 'draft' }), false);
  assert.equal(isBookingConfigured({ ...fixture, depositPerGuest: null }), false);
  assert.equal(isBookingConfigured({ ...fixture, depositConfirmed: false }), false);
  assert.equal(isBookingConfigured({ ...fixture, depositConfirmed: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, depositVersion: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, coursePrice: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, priceApproved: false }), false);
  assert.equal(isBookingConfigured({ ...fixture, priceApproved: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, pairingPrice: -1 }), false);
  assert.equal(isBookingConfigured({ ...fixture, capacity: 2 }), false);
  assert.equal(isBookingConfigured({ ...fixture, termsApproved: false }), false);
  assert.equal(isBookingConfigured({ ...fixture, termsApproved: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, termsVersion: '  ' }), false);
  assert.equal(isBookingConfigured({ ...fixture, allowedGuestCounts: [5] }), false);
  assert.equal(isBookingConfigured({ ...fixture, allowedGuestCounts: [1, 2] }), false);
  assert.equal(isBookingConfigured({ ...fixture, minimumGuests: 1, allowedGuestCounts: [1, 2, 3, 4] }), false);
  assert.equal(isBookingConfigured({ ...fixture, minimumGuests: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, closesAt: fixture.opensAt }), false);
  assert.equal(isBookingConfigured({ ...fixture, slotStartsAt: undefined }), false);
  assert.equal(isBookingConfigured({ ...fixture, slotStartsAt: new Date('invalid') }), false);
  assert.equal(isBookingConfigured({ ...fixture, slotStartsAt: fixture.opensAt }), false);
  assert.equal(isBookingConfigured({ ...fixture, slotStartsAt: fixture.closesAt }), true);
});

test('허용된 조합과 실제 점유 및 인원 한도를 모두 확인한다', () => {
  const fixture = { guests: 4, allowedGuestCounts: [2, 3, 4], capacity: 8, occupiedGuests: 2, occupiedTableIds: ['A'], combinations: [{ tableIds: ['A', 'B'], guestCounts: [4] }, { tableIds: ['C', 'D'], guestCounts: [4] }] };
  assert.deepEqual(selectTableCombination(fixture), ['C', 'D']);
  assert.equal(selectTableCombination({ ...fixture, occupiedTableIds: ['A', 'C'] }), null);
  assert.equal(selectTableCombination({ ...fixture, occupiedGuests: 5 }), null);
  assert.equal(selectTableCombination({ ...fixture, allowedGuestCounts: [2] }), null);
  assert.equal(selectTableCombination({ ...fixture, combinations: [{ tableIds: ['C', 'C'], guestCounts: [4] }] }), null);
  assert.equal(selectTableCombination({ ...fixture, guests: 5 }), null);
  assert.equal(selectTableCombination({ ...fixture, guests: 1, allowedGuestCounts: [1], combinations: [{ tableIds: ['C'], guestCounts: [1] }] }), null);
});

test('손상된 테이블 점유 정보는 빈자리로 간주하지 않는다', () => {
  const fixture = { guests: 2, allowedGuestCounts: [2], capacity: 4, occupiedGuests: 2, occupiedTableIds: ['A'], combinations: [{ tableIds: ['B'], guestCounts: [2] }] };
  for (const occupiedTableIds of [[null], [''], [' A '], [123]]) {
    assert.equal(selectTableCombination({ ...fixture, occupiedTableIds }), null);
  }
  assert.equal(selectTableCombination({ ...fixture, combinations: [null, { tableIds: [' B '], guestCounts: [2] }] }), null);
  assert.deepEqual(selectTableCombination({ ...fixture, combinations: [null, { tableIds: ['B'], guestCounts: [2] }] }), ['B']);
});
