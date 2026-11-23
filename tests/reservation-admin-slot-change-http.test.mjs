import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminSlotChangeHttp } from '../src/reservation/admin-slot-change-http.mjs';

const body = { slotId: 'fixture-slot', startsAt: '2026-12-25T09:00:00.000Z' };
const request = (data, authorization = 'Bearer fixture-token') => new Request('http://localhost/admin/slot', { method: 'POST', headers: { 'content-type': 'application/json', authorization }, body: JSON.stringify(data) });
const dependencies = { verifyAccessToken: async () => ({ id: 'verified-user' }), loadAdminGrant: async () => ({ active: true, userId: 'verified-user', eventId: 'test-event', role: 'event_admin' }), changeSlotWithAuditAtomically: async () => 'changed' };

test('인증·행사 권한이 없으면 회차 변경을 호출하지 않는다', async () => {
  let calls = 0;
  const deps = { ...dependencies, loadAdminGrant: async () => null, changeSlotWithAuditAtomically: async () => { calls++; return 'changed'; } };
  assert.equal((await handleAdminSlotChangeHttp(request(body, ''), 'test-event', deps)).status, 401);
  assert.equal((await handleAdminSlotChangeHttp(request(body), 'test-event', deps)).status, 403);
  assert.equal(calls, 0);
});

test('검증된 행사와 관리자만 저장소에 전달한다', async () => {
  let received;
  const response = await handleAdminSlotChangeHttp(request({ ...body, eventId: 'forged', actorId: 'forged' }), 'test-event', { ...dependencies, changeSlotWithAuditAtomically: async (input) => { received = input; return 'changed'; } });
  assert.deepEqual(received, { eventId: 'test-event', slotId: body.slotId, startsAt: body.startsAt, actorId: 'verified-user' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('시각·회차 형식 오류와 트랜잭션 거부를 처리한다', async () => {
  for (const invalid of [{ ...body, slotId: '../bad' }, { ...body, startsAt: '2026-12-25T18:00:00' }, { ...body, startsAt: '2026-02-30T09:00:00.000Z' }]) {
    assert.equal((await handleAdminSlotChangeHttp(request(invalid), 'test-event', dependencies)).status, 400);
  }
  for (const [result, status] of [['has_bookings', 409], ['invalid_start', 400], ['denied', 403], ['unavailable', 503]]) {
    assert.equal((await handleAdminSlotChangeHttp(request(body), 'test-event', { ...dependencies, changeSlotWithAuditAtomically: async () => result })).status, status);
  }
  const response = await handleAdminSlotChangeHttp(request(body), 'test-event', { ...dependencies, changeSlotWithAuditAtomically: async () => { throw new Error('private detail'); } });
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private detail'), false);
});
