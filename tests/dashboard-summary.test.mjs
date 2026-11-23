import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeReservations } from '../src/reservation/dashboard-summary.mjs';

test('예약 통계는 취소를 제외하고 회차별로 정렬한다', () => {
  const row = { reservation_date: '2026-12-25', reservation_time: '17:30:00', guests: 2, pairing_guests: 1, course_price: 120000, pairing_price: 40000 };
  const result = summarizeReservations([{ ...row, status: 'confirmed' }, { ...row, status: 'pending', reservation_date: '2026-12-24' }, { ...row, status: 'cancelled' }]);
  assert.equal(result.activeCount, 2);
  assert.equal(result.totalGuests, 4);
  assert.equal(result.confirmedGuests, 2);
  assert.equal(result.pendingGuests, 2);
  assert.equal(result.revenue, 560000);
  assert.deepEqual(result.groups.map(([key]) => key), ['2026-12-24_17:30', '2026-12-25_17:30']);
});
