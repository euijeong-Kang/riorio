import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminCancelHttp } from '../src/reservation/admin-cancel-http.mjs';

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const request = (body, authorization = 'Bearer fixture-token') => new Request('http://localhost/admin/cancel', { method: 'POST', headers: { 'content-type': 'application/json', authorization }, body: JSON.stringify(body) });
const dependencies = { verifyAccessToken: async () => ({ id: 'verified-user' }), loadAdminGrant: async () => ({ active: true, userId: 'verified-user', eventId: 'test-event', role: 'event_admin' }), cancelWithAuditAtomically: async () => 'cancelled' };

test('비인가 요청은 취소 저장소를 호출하지 않는다', async () => {
  let calls = 0;
  const deps = { ...dependencies, loadAdminGrant: async () => null, cancelWithAuditAtomically: async () => { calls++; return 'cancelled'; } };
  assert.equal((await handleAdminCancelHttp(request({ reservationId: id }), 'test-event', deps)).status, 403);
  assert.equal((await handleAdminCancelHttp(request({ reservationId: id }, ''), 'test-event', deps)).status, 401);
  assert.equal(calls, 0);
});

test('검증된 관리자·행사·예약만 전달하고 중복 취소를 구분한다', async () => {
  let received;
  const deps = { ...dependencies, cancelWithAuditAtomically: async (input) => { received = input; return 'already_cancelled'; } };
  const response = await handleAdminCancelHttp(request({ reservationId: id, actorId: 'forged', eventId: 'other' }), 'test-event', deps);
  assert.deepEqual(received, { eventId: 'test-event', reservationId: id, actorId: 'verified-user' });
  assert.deepEqual(await response.json(), { status: 'already_cancelled' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('잘못된 예약 ID와 감사 저장 실패를 거부한다', async () => {
  assert.equal((await handleAdminCancelHttp(request({ reservationId: 'bad' }), 'test-event', dependencies)).status, 400);
  const response = await handleAdminCancelHttp(request({ reservationId: id }), 'test-event', { ...dependencies, cancelWithAuditAtomically: async () => { throw new Error('private detail'); } });
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private detail'), false);
});
