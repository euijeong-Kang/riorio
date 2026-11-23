import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPriceSnapshot } from '../src/reservation/price-snapshot.mjs';
import { calculatePerGuestDeposit } from '../src/reservation/policy.mjs';

test('가상 가격으로 예약 당시 총액, 예약금 및 잔액을 고정한다', () => {
  const config = { guests: 2, pairingGuests: 1, coursePrice: 1000, pairingPrice: 300, depositPerReservation: 500 };
  const snapshot = createPriceSnapshot(config);
  assert.deepEqual(snapshot, { guests: 2, pairingGuests: 1, coursePrice: 1000, pairingPrice: 300, total: 2300, deposit: 500, remaining: 1800 });
  config.coursePrice = 2000;
  assert.equal(snapshot.total, 2300);
  assert.throws(() => { snapshot.total = 1; }, TypeError);
});

test('미정 또는 범위를 벗어난 예약금은 거부한다', () => {
  const input = { guests: 2, pairingGuests: 0, coursePrice: 1000, pairingPrice: 300 };
  for (const depositPerReservation of [null, -1, 2001, 0.5]) assert.throws(() => createPriceSnapshot({ ...input, depositPerReservation }));
  assert.equal(createPriceSnapshot({ ...input, depositPerReservation: 0 }).remaining, 2000);
});

test('인원당 예약금과 잔액을 인원에 맞춰 계산한다', () => {
  for (const guests of [2, 3, 4]) {
    const depositPerReservation = calculatePerGuestDeposit(guests, 30000);
    const snapshot = createPriceSnapshot({ guests, pairingGuests: 0, coursePrice: 120000, pairingPrice: 40000, depositPerReservation });
    assert.equal(snapshot.deposit, guests * 30000);
    assert.equal(snapshot.remaining, guests * 90000);
  }
  for (const guests of [1, 5, 2.5]) assert.throws(() => calculatePerGuestDeposit(guests, 30000));
  for (const amount of [-1, 0.5, Number.MAX_SAFE_INTEGER]) assert.throws(() => calculatePerGuestDeposit(2, amount));
});
