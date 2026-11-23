import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { createReservationService } from '../src/reservation/create-reservation-service.mjs';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';

const run = promisify(execFile);
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;

test('DB의 약관이 변경되면 오래된 서버 설정으로 접수하지 않는다', { skip: !psql || !passwordFile, timeout: 30000 }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const args = ['-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-qAt'];
  const query = async (sql) => (await run(psql, [...args, '-c', sql], { env, timeout: 15000 })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected);
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const suffix = randomUUID().replaceAll('-', '');
  const schema = `consent_test_${suffix}`;
  const event = `consent_${suffix}`;
  const key = `booking-${suffix}`;
  const slot = randomInt(1_000_000, 2_000_000_000);
  const fixture = await readFile(new URL('./fixtures/reservation-consent-transaction.sql', import.meta.url), 'utf8');
  const definition = fixture.slice(fixture.indexOf('CREATE TABLE policy_fixture.test_terms_approvals'), fixture.indexOf('\nINSERT INTO allocation_fixture.slots'))
    .replaceAll('policy_fixture.test_terms_approvals', `${schema}.test_terms_approvals`)
    .replaceAll('policy_fixture.test_consent_snapshots', `${schema}.test_consent_snapshots`)
    .replaceAll('policy_fixture.test_book_with_consent', `${schema}.test_book_with_consent`);
  let initialized = false;
  try {
    await query(`create schema ${schema}; ${definition} insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into ${schema}.test_terms_approvals values ('${event}',true,'v1');`);
    initialized = true;
    const config = { status: 'booking_open', priceApproved: true, eventId: event, slotId: String(slot), opensAt: new Date(Date.now() - 3600000), closesAt: new Date(Date.now() + 3600000), slotStartsAt: new Date(Date.now() + 7200000), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [4], coursePrice: 1000, pairingPrice: 300 };
    const request = { eventId: event, slotId: String(slot), guests: 4, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: key, recoveryToken: issueRecoveryToken() };
    const fingerprints = [];
    const dependencies = { now: () => new Date(), recoverySecret: randomBytes(32), loadTrustedConfig: async () => config, createAtomically: async ({ request: input, recoveryDigest, fingerprint }) => {
      assert.equal(input.termsAccepted, true);
      assert.equal(input.termsVersion, 'v1');
      assert.match(fingerprint, /^[a-f0-9]{64}$/);
      fingerprints.push(fingerprint);
      return query(`select ${schema}.test_book_with_consent('${event}',${slot},'${key}','${recoveryDigest}','v1',true,'${fingerprint}');`);
    } };
    await query(`update ${schema}.test_terms_approvals set version='v2' where event_id='${event}';`);
    assert.deepEqual(await createReservationService(request, dependencies), { status: 409, body: { error: 'TERMS_CHANGED' } });
    assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '0:0');
    await query(`update ${schema}.test_terms_approvals set version='v1' where event_id='${event}';`);
    assert.deepEqual(await createReservationService(request, dependencies), { status: 202, body: { status: 'received' } });
    assert.equal(await query(`select count(*) from ${schema}.test_consent_snapshots where request_key='${key}' and version='v1' and accepted=true;`), '1');
    assert.equal(await query(`select fingerprint from allocation_fixture.bookings where request_key='${key}';`), fingerprints[1]);
    assert.deepEqual(await createReservationService(request, dependencies), { status: 409, body: { error: 'REQUEST_STATUS_REQUIRED' } });
    assert.deepEqual(await createReservationService({ ...request, name: '다른 가상 고객' }, dependencies), { status: 409, body: { error: 'REQUEST_CONFLICT' } });
    assert.equal(fingerprints[1], fingerprints[2]);
    assert.notEqual(fingerprints[2], fingerprints[3]);
    assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}') || ':' || (select count(*) from ${schema}.test_consent_snapshots where request_key='${key}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '1:1:2');
  } finally {
    if (initialized) await query(`drop schema ${schema} cascade; delete from policy_fixture.recovery_tokens where request_key='${key}'; delete from policy_fixture.price_snapshots where request_key='${key}'; delete from allocation_fixture.occupied_tables where slot_id=${slot}; delete from allocation_fixture.bookings where request_key='${key}'; delete from policy_fixture.event_slots where event_id='${event}' and slot_id=${slot}; delete from policy_fixture.events where id='${event}'; delete from allocation_fixture.combinations where slot_id=${slot}; delete from allocation_fixture.slots where id=${slot};`);
  }
});
