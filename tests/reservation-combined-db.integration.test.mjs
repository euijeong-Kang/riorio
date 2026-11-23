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

for (const [guests, pairingGuests, total] of [[2, 1, 2300], [3, 3, 3900]]) test(`가상 ${guests}인 요청을 통합 트랜잭션과 검증한다`, { skip: !psql || !passwordFile, timeout: 30000 }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const args = ['-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-qAt'];
  const query = async (sql) => (await run(psql, [...args, '-c', sql], { env, timeout: 15000 })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected);
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const suffix = randomUUID().replaceAll('-', '');
  const schema = `combined_test_${suffix}`;
  const event = `combined_${suffix}`;
  const key = `booking-${suffix}`;
  const slot = randomInt(1_000_000, 2_000_000_000);
  const fixture = await readFile(new URL('./fixtures/reservation-combined-transaction.sql', import.meta.url), 'utf8');
  const definition = fixture.slice(fixture.indexOf('CREATE SCHEMA combined_fixture'), fixture.indexOf('\nINSERT INTO allocation_fixture.slots')).replaceAll('combined_fixture', schema);
  let initialized = false;
  try {
    await query(`${definition} insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,${guests},ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into ${schema}.settings values ('${event}',${slot},clock_timestamp()+interval '2 hours',true,'v1',true,500,'deposit-v1');`);
    initialized = true;
    const config = { status: 'booking_open', priceApproved: true, eventId: event, slotId: String(slot), opensAt: new Date(Date.now() - 3600000), closesAt: new Date(Date.now() + 3600000), slotStartsAt: new Date(Date.now() + 7200000), termsVersion: 'v1', termsApproved: true, depositPerGuest: 500, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [2, 3, 4], coursePrice: 1000, pairingPrice: 300 };
    const request = { eventId: event, slotId: String(slot), guests, pairingGuests, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: guests * 500, expectedDepositVersion: 'deposit-v1', idempotencyKey: key, recoveryToken: issueRecoveryToken() };
    const dependencies = { now: () => new Date(), recoverySecret: randomBytes(32), loadTrustedConfig: async () => config, createAtomically: async ({ request: input, fingerprint, recoveryDigest, total: actual }) => {
      assert.equal(actual, total);
      assert.equal(input.termsAccepted, true);
      assert.match(fingerprint, /^[a-f0-9]{64}$/);
      assert.equal(input.expectedDeposit, guests * 500);
      assert.equal(input.expectedDepositVersion, 'deposit-v1');
      return query(`select ${schema}.book('${event}',${slot},'${key}','${recoveryDigest}','${fingerprint}','v1',true,${input.expectedDeposit},'${input.expectedDepositVersion}',${guests},${pairingGuests});`);
    } };
    await query(`update ${schema}.settings set deposit_per_guest=600, deposit_version='deposit-v2' where event_id='${event}';`);
    assert.deepEqual(await createReservationService(request, dependencies), { status: 409, body: { error: 'DEPOSIT_CHANGED' } });
    assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${key}';`), '0');
    await query(`update ${schema}.settings set deposit_per_guest=500, deposit_version='deposit-v1' where event_id='${event}';`);
    assert.deepEqual(await createReservationService(request, dependencies), { status: 202, body: { status: 'received' } });
    assert.deepEqual(await createReservationService(request, dependencies), { status: 409, body: { error: 'REQUEST_STATUS_REQUIRED' } });
    assert.deepEqual(await createReservationService({ ...request, name: '다른 가상 고객' }, dependencies), { status: 409, body: { error: 'REQUEST_CONFLICT' } });
    assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}') || ':' || (select count(*) from ${schema}.snapshots where request_key='${key}' and total=${total} and deposit_amount=${guests * 500} and terms_version='v1') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '1:1:2');
  } finally {
    if (initialized) await query(`drop schema ${schema} cascade; delete from policy_fixture.recovery_tokens where request_key='${key}'; delete from policy_fixture.price_snapshots where request_key='${key}'; delete from allocation_fixture.occupied_tables where slot_id=${slot}; delete from allocation_fixture.bookings where request_key='${key}'; delete from policy_fixture.event_slots where event_id='${event}' and slot_id=${slot}; delete from policy_fixture.events where id='${event}'; delete from allocation_fixture.combinations where slot_id=${slot}; delete from allocation_fixture.slots where id=${slot};`);
  }
});
