import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TRANSFER_DEADLINE_HOURS } from '../src/reservation/policy.mjs';

test('비공개 시안은 한영 입금 기한을 공통 설정으로 표시하고 실제 계좌를 노출하지 않는다', async () => {
  const source = await readFile(new URL('../src/reservation/ReservationPreview.tsx', import.meta.url), 'utf8');
  assert.equal(TRANSFER_DEADLINE_HOURS, 12);
  assert.equal((source.match(/\$\{TRANSFER_DEADLINE_HOURS\}/g) ?? []).length, 4);
  assert.match(source, /신청 후 \$\{TRANSFER_DEADLINE_HOURS\}시간/);
  assert.match(source, /within \$\{TRANSFER_DEADLINE_HOURS\} hours/);
  assert.doesNotMatch(source, /756001-00-178779/);
  assert.match(source, /예약 준비 중/);
});
