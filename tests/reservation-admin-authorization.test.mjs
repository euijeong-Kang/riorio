import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeEventAdmin } from '../src/reservation/admin-authorization.mjs';

const dependencies = { verifyAccessToken: async () => ({ id: 'test-user' }), loadAdminGrant: async () => ({ active: true, userId: 'test-user', eventId: 'test-event', role: 'event_admin' }) };

test('검증된 신원과 해당 행사 관리자 권한이 모두 필요하다', async () => {
  assert.deepEqual(await authorizeEventAdmin('Bearer test-token', 'test-event', dependencies), { ok: true, principalId: 'test-user', eventId: 'test-event' });
  assert.equal((await authorizeEventAdmin('', 'test-event', dependencies)).status, 401);
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', { ...dependencies, verifyAccessToken: async () => null })).status, 401);
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', { ...dependencies, loadAdminGrant: async () => ({ active: true, userId: 'test-user', eventId: 'other-event', role: 'event_admin' }) })).status, 403);
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', { ...dependencies, loadAdminGrant: async () => ({ active: false, userId: 'test-user', eventId: 'test-event', role: 'event_admin' }) })).status, 403);
});

test('인증·인가 서비스의 장애나 미설정은 차단한다', async () => {
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', null)).status, 503);
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', { ...dependencies, verifyAccessToken: async () => { throw new Error('offline'); } })).status, 503);
  assert.equal((await authorizeEventAdmin('Bearer test-token', 'test-event', { ...dependencies, loadAdminGrant: async () => { throw new Error('offline'); } })).status, 503);
  assert.equal((await authorizeEventAdmin('Bearer test-token', '../bad', dependencies)).status, 400);
});
