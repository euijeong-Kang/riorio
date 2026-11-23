import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmFictionalTransfer } from '../src/reservation/admin-transfer-preview-model.mjs';

test('가상 입금 확인 체크 후에만 시안 상태가 변경된다', () => {
  const pending = { status: 'pending', guests: 2, deposit: 60000 };
  assert.equal(confirmFictionalTransfer(pending, false), pending);
  const confirmed = confirmFictionalTransfer(pending, true);
  assert.deepEqual(confirmed, { ...pending, status: 'confirmed' });
  assert.equal(pending.status, 'pending');
  assert.equal(confirmFictionalTransfer(confirmed, true), confirmed);
});

test('가상 취소·알 수 없는 상태는 승인하지 않는다', () => {
  for (const status of ['cancelled', 'unknown']) {
    const reservation = { status };
    assert.equal(confirmFictionalTransfer(reservation, true), reservation);
  }
  assert.equal(confirmFictionalTransfer(null, true), null);
});
