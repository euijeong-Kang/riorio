import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminConfirmTransferHttp } from '../src/reservation/admin-confirm-transfer-http.mjs';

const reservationId = '12345678-1234-1234-1234-123456789abc';
const request = (body = { reservationId, transferChecked: true }, authorization = 'Bearer fixture') => new Request('http://localhost/confirm-transfer', { method: 'POST', headers: { 'content-type': 'application/json', authorization }, body: JSON.stringify(body) });
const dependencies = { verifyAccessToken: async () => ({ id: 'verified-admin' }), loadAdminGrant: async () => ({ active: true, userId: 'verified-admin', eventId: 'fixture', role: 'event_admin' }), confirmTransferWithAuditAtomically: async () => 'confirmed' };

test('인증과 행사 권한이 없으면 입금 확인 저장을 호출하지 않는다', async () => {
  let calls = 0;
  const confirmTransferWithAuditAtomically = async () => { calls++; return 'confirmed'; };
  assert.equal((await handleAdminConfirmTransferHttp(request({ reservationId }, ''), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically })).status, 401);
  assert.equal((await handleAdminConfirmTransferHttp(request(), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically, loadAdminGrant: async () => null })).status, 403);
  assert.equal(calls, 0);
});

test('검증된 관리자와 행사만 저장 모형에 전달한다', async () => {
  let received;
  const response = await handleAdminConfirmTransferHttp(request({ reservationId, transferChecked: true, actorId: 'forged', eventId: 'other', amount: 1 }), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically: async (value) => { received = value; return 'confirmed'; } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'confirmed' });
  assert.deepEqual(received, { eventId: 'fixture', reservationId, actorId: 'verified-admin' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('관리자의 입금 확인 표기가 없으면 승인 저장을 호출하지 않는다', async () => {
  let calls = 0;
  const confirmTransferWithAuditAtomically = async () => { calls++; return 'confirmed'; };
  for (const transferChecked of [undefined, false, 'true', 1]) {
    const response = await handleAdminConfirmTransferHttp(request({ reservationId, transferChecked }), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically });
    assert.equal(response.status, 400);
  }
  assert.equal(calls, 0);
});

test('취소 등 부적격 상태와 저장·감사 오류를 구분하고 내부 정보를 숨긴다', async () => {
  for (const [result, status, error] of [['already_confirmed', 200, null], ['not_found', 404, 'NOT_FOUND'], ['not_eligible', 409, 'NOT_ELIGIBLE'], ['unknown', 503, 'SERVICE_UNAVAILABLE']]) {
    const response = await handleAdminConfirmTransferHttp(request(), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically: async () => result });
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), error ? { error } : { status: result });
  }
  const response = await handleAdminConfirmTransferHttp(request(), 'fixture', { ...dependencies, confirmTransferWithAuditAtomically: async () => { throw new Error('private'); } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'SERVICE_UNAVAILABLE' });
  assert.equal((await handleAdminConfirmTransferHttp(request({ reservationId: 'bad' }), 'fixture', dependencies)).status, 400);
});
