import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { issueRecoveryToken, recoveryTokenDigest } from '../src/reservation/recovery-token.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';

const secret = randomBytes(32);
const token = issueRecoveryToken();
const digest = recoveryTokenDigest(token, secret);
const now = () => new Date('2026-01-02T00:00:00Z');
const record = { digest, status: 'received', expiresAt: new Date('2026-01-03T00:00:00Z'), revoked: false };
const deps = { secret, now, checkRateLimit: async () => true, lookupByDigest: async (value) => value === digest ? record : null };
const request = (value) => new Request('http://localhost/recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: value }) });

test('유효한 가상 토큰은 행사 접수 시간과 관계없이 최소 상태만 확인한다', async () => {
  const response = await handleRecoveryHttp(request(token), deps);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'received' });
});

test('만료·폐기·틀린 토큰은 동일하게 거부한다', async () => {
  const results = await Promise.all([
    handleRecoveryHttp(request('invalid'), deps),
    handleRecoveryHttp(request(issueRecoveryToken()), deps),
    handleRecoveryHttp(request(token), { ...deps, lookupByDigest: async () => ({ ...record, expiresAt: now() }) }),
    handleRecoveryHttp(request(token), { ...deps, lookupByDigest: async () => ({ ...record, revoked: true }) }),
  ]);
  for (const response of results) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'RECOVERY_UNAVAILABLE' });
  }
});

test('요청 제한 장애나 제한 시 저장소 조회 없이 거부한다', async () => {
  let calls = 0;
  const lookupByDigest = async () => { calls++; return record; };
  assert.equal((await handleRecoveryHttp(request(token), { ...deps, lookupByDigest, checkRateLimit: async () => false })).status, 429);
  assert.equal((await handleRecoveryHttp(request(token), { ...deps, lookupByDigest, checkRateLimit: async () => { throw new Error('offline'); } })).status, 503);
  assert.equal(calls, 0);
});

test('저장소 장애와 잘못된 서버 상태는 상세 정보 없이 거부한다', async () => {
  const results = await Promise.all([
    handleRecoveryHttp(request(token), { ...deps, lookupByDigest: async () => { throw new Error('sensitive database detail'); } }),
    handleRecoveryHttp(request(token), { ...deps, lookupByDigest: async () => ({ ...record, status: 'unexpected', name: '가상 고객' }) }),
    handleRecoveryHttp(request(token), { ...deps, lookupByDigest: async () => ({ ...record, expiresAt: new Date('invalid') }) }),
    handleRecoveryHttp(request(token), { ...deps, now: () => new Date('invalid') }),
  ]);
  for (const response of results) {
    assert.ok([404, 503].includes(response.status));
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'RECOVERY_UNAVAILABLE' });
  }
});

test('본문 오류와 크기 초과는 저장소를 조회하지 않는다', async () => {
  let calls = 0;
  const lookupByDigest = async () => { calls++; return record; };
  const invalidRequest = (body) => new Request('http://localhost/recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  assert.equal((await handleRecoveryHttp(invalidRequest('{'), { ...deps, lookupByDigest })).status, 400);
  assert.equal((await handleRecoveryHttp(invalidRequest(JSON.stringify({ token: 'x'.repeat(8193) })), { ...deps, lookupByDigest })).status, 413);
  assert.equal(calls, 0);
});
