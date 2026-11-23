import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEventReservationRequest } from '../src/reservation/reservation-router.mjs';

const request = (path, body = {}, authorization) => new Request(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body) });

test('행사 예약 라우터는 별도 서버 활성화 없이 예약을 거부한다', async () => {
  let calls = 0;
  const reservations = { loadTrustedConfig: async () => { calls++; } };
  for (const dependencies of [undefined, { reservations }, { bookingEnabled: false, reservations }, { bookingEnabled: true }]) {
    assert.equal((await handleEventReservationRequest(request('/api/events/christmas-2026/reservations'), dependencies)).status, 503);
  }
  assert.equal(calls, 0);
  assert.equal((await handleEventReservationRequest(request('/api/events/christmas-2026/other'))).status, 404);
});

test('다른 행사 요청은 설정과 저장소에 전달하지 않는다', async () => {
  let loads = 0;
  let saves = 0;
  const dependencies = { bookingEnabled: true, reservations: { checkRateLimit: async () => true, now: () => new Date(), loadTrustedConfig: async () => { loads++; return {}; }, createAtomically: async () => { saves++; } } };
  const response = await handleEventReservationRequest(request('/api/events/christmas-2026/reservations', { eventId: 'other-event', slotId: 'slot' }), dependencies);
  assert.equal(response.status, 503);
  assert.equal(loads, 0);
  assert.equal(saves, 0);
});

test('예약이 닫혀 있어도 복구와 관리자 경로는 각자 인증과 설정을 요구한다', async () => {
  const denied = await handleEventReservationRequest(request('/api/events/christmas-2026/admin/confirm-transfer'), { bookingEnabled: false });
  assert.equal(denied.status, 401);
  const unavailable = await handleEventReservationRequest(request('/api/events/christmas-2026/recovery'), { bookingEnabled: false });
  assert.equal(unavailable.status, 503);
});
