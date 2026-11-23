import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventReservationClient } from '../src/reservation/event-api-client.mjs';

test('같은 출처 행사 경로로만 신청과 복구를 전송한다', async () => {
  const calls = [];
  const client = createEventReservationClient({ eventId: 'christmas-2026', baseUrl: '/api', fetchImpl: async (...args) => { calls.push(args); return new Response(null, { status: 202 }); } });
  const controller = new AbortController();
  await client.submit({ eventId: 'christmas-2026', guests: 2 }, controller.signal);
  await client.recover({ token: 'fixture' });
  assert.equal(calls[0][0], '/api/events/christmas-2026/reservations');
  assert.equal(calls[0][1].redirect, 'error');
  assert.equal(calls[0][1].signal, controller.signal);
  assert.equal(calls[1][0], '/api/events/christmas-2026/recovery');
  assert.throws(() => client.submit({ eventId: 'other' }));
  assert.equal(calls.length, 2);
});

test('잘못된 API 주소나 행사 ID는 전송하기 전에 거부한다', () => {
  for (const baseUrl of ['', 'https://example.com', '//example.com', '/api?other', '/api\\evil']) {
    assert.throws(() => createEventReservationClient({ eventId: 'event', baseUrl }));
  }
  assert.throws(() => createEventReservationClient({ eventId: '../event', baseUrl: '/api' }));
});
