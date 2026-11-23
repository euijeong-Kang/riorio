import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID, webcrypto } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { loadOrCreateAttempt } from '../src/reservation/attempt-session.mjs';
import { issueRecoveryToken, recoveryTokenDigest } from '../src/reservation/recovery-token.mjs';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';

const run = promisify(execFile);
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;

test('가상 신청 응답 유실 뒤 마감된 행사에서 토큰으로 최소 상태를 확인한다', { skip: !passwordFile || !psql }, async () => {
  const password = await readFile(passwordFile, 'utf8');
  const env = { ...process.env, PGPASSWORD: password };
  const query = async (sql) => (await run(psql, ['-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { env })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected, 'RIORIO_LOCAL_TEST_DATA_DIRECTORY is required');
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const slot = randomInt(1_000_000, 2_000_000_000);
  const event = `fixture_${randomUUID().replaceAll('-', '')}`;
  await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,current_timestamp-interval '1 hour',current_timestamp+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot});`);
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const attempt = loadOrCreateAttempt(event, storage, webcrypto);
  const secret = randomBytes(32);
  const now = () => new Date();
  const config = { status: 'booking_open', priceApproved: true, eventId: event, slotId: String(slot), opensAt: new Date(Date.now() - 3600000), closesAt: new Date(Date.now() + 3600000), slotStartsAt: new Date(Date.now() + 7200000), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [4], coursePrice: 1000, pairingPrice: 300 };
  const body = { eventId: event, slotId: String(slot), guests: 4, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', ...attempt };
  let fingerprint;
  const tokenDigest = recoveryTokenDigest(attempt.recoveryToken, secret);
  const dependencies = {
    checkRateLimit: async () => true,
    recoverySecret: secret,
    now,
    loadTrustedConfig: async () => config,
    createAtomically: async ({ recoveryDigest, fingerprint: requestFingerprint }) => { assert.match(recoveryDigest, /^[a-f0-9]{64}$/); assert.match(requestFingerprint, /^[a-f0-9]{64}$/); fingerprint ??= requestFingerprint; return query(`select policy_fixture.book_with_recovery('${event}',${slot},'${attempt.idempotencyKey}','${requestFingerprint}',4,0,'v1','${recoveryDigest}',current_timestamp+interval '1 hour');`); },
  };
  const submission = (input = body) => new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  assert.equal((await handleReservationHttp(submission(), dependencies)).status, 202);
  assert.equal((await handleReservationHttp(submission(), dependencies)).status, 202);
  const conflict = await handleReservationHttp(submission({ ...body, name: '다른 가상 고객' }), dependencies);
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), { error: 'REQUEST_CONFLICT' });
  const unauthorized = await handleReservationHttp(submission({ ...body, name: '다른 가상 고객', recoveryToken: issueRecoveryToken() }), dependencies);
  assert.equal(unauthorized.status, 503);
  assert.deepEqual(await unauthorized.json(), { error: 'BOOKING_UNAVAILABLE' });
  assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${attempt.idempotencyKey}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '1:2');
  await query(`update policy_fixture.events set is_open=false where id='${event}';`);
  config.status = 'draft';
  assert.equal((await handleReservationHttp(submission(), dependencies)).status, 503);

  const replay = (digest, requestFingerprint = fingerprint) => query(`select policy_fixture.book_with_recovery('${event}',${slot},'${attempt.idempotencyKey}','${requestFingerprint}',4,0,'v1','${digest}',current_timestamp+interval '1 hour');`);
  const wrongDigest = recoveryTokenDigest(loadOrCreateAttempt('wrong-replay-fixture', storage, webcrypto).recoveryToken, secret);
  assert.equal(await replay(tokenDigest), 'replay');
  assert.equal(await replay(wrongDigest), 'unavailable');
  assert.equal(await replay(wrongDigest, 'different-fingerprint'), 'unavailable');
  assert.equal(await replay(tokenDigest, 'different-fingerprint'), 'conflict');
  await query(`update policy_fixture.recovery_tokens set expires_at=current_timestamp-interval '1 second' where request_key='${attempt.idempotencyKey}';`);
  assert.equal(await replay(tokenDigest), 'unavailable');
  await query(`update policy_fixture.recovery_tokens set expires_at=current_timestamp+interval '1 hour' where request_key='${attempt.idempotencyKey}';`);

  const restored = loadOrCreateAttempt(event, storage, webcrypto);
  const recoveryDeps = {
    secret,
    now,
    checkRateLimit: async () => true,
    lookupByDigest: async (digest) => {
      const raw = await query(`select json_build_object('digest',token_digest,'status',policy_fixture.recover(token_digest),'expiresAt',expires_at,'revoked',revoked)::text from policy_fixture.recovery_tokens where token_digest='${digest}';`);
      if (!raw) return null;
      const record = JSON.parse(raw);
      return { ...record, expiresAt: new Date(record.expiresAt) };
    },
  };
  const recover = (value) => new Request('http://localhost/recovery', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: value }) });
  const response = await handleRecoveryHttp(recover(restored.recoveryToken), recoveryDeps);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'received' });
  assert.equal((await handleRecoveryHttp(recover(loadOrCreateAttempt('different-fixture', storage, webcrypto).recoveryToken), recoveryDeps)).status, 404);
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${attempt.idempotencyKey}';`), '1');
});
