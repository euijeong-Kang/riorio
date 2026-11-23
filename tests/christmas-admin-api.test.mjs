import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChristmasAdminApi } from '../src/reservation/christmas-admin-api.mjs';

test('관리자 승인은 입금 확인이 있어야 하고 Supabase RPC로 전달한다', async () => {
  const calls = [];
  const api = createChristmasAdminApi({ from: () => {}, rpc: async (...args) => { calls.push(args); return { data: 'confirmed', error: null }; } });
  const id = '12345678-1234-1234-1234-123456789abc';
  await assert.rejects(api.update(id, 'confirmed', false));
  assert.equal(calls.length, 0);
  assert.equal(await api.update(id, 'confirmed', true), 'confirmed');
  assert.deepEqual(calls[0], ['christmas_reservation_admin_action_2026', { p_reservation_id: id, p_action: 'confirmed', p_transfer_checked: true }]);
});

test('서버 실패와 잘못된 요청은 성공으로 처리하지 않는다', async () => {
  const api = createChristmasAdminApi({ from: () => {}, rpc: async () => ({ error: new Error('private database details') }) });
  await assert.rejects(api.update('bad', 'cancelled'));
  await assert.rejects(api.update('12345678-1234-1234-1234-123456789abc', 'cancelled'), /예약 상태를 변경하지 못했습니다/);
});
