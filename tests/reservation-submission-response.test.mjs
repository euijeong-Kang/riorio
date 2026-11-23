import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretSubmissionResponse } from '../src/reservation/interpret-submission-response.mjs';

test('가상 접수와 확인이 필요한 충돌을 구분한다', async () => {
  assert.equal(await interpretSubmissionResponse(Response.json({ status: 'received' }, { status: 202 })), 'received');
  for (const [error, state] of Object.entries({ REQUEST_STATUS_REQUIRED: 'status-required', REQUEST_CONFLICT: 'request-conflict', SOLD_OUT: 'soldout-error', PRICE_CHANGED: 'price-changed', DEPOSIT_CHANGED: 'deposit-changed', TERMS_CHANGED: 'terms-changed' })) {
    assert.equal(await interpretSubmissionResponse(Response.json({ error }, { status: 409 })), state);
  }
});

test('예상 밖 응답은 접수나 미접수로 단정하지 않는다', async () => {
  for (const response of [null, Response.json({ status: 'received' }, { status: 200 }), Response.json({ status: 'confirmed' }, { status: 202 }), Response.json({ status: 'received', extra: 'value' }, { status: 202 }), Response.json({ error: 'unknown' }, { status: 409 }), Response.json({ error: 'SOLD_OUT' }, { status: 503 }), new Response('invalid', { status: 202 })]) {
    assert.equal(await interpretSubmissionResponse(response), 'unavailable');
  }
});
