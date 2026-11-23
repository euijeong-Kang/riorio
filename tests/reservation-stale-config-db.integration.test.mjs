import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';
import { createReservationService } from '../src/reservation/create-reservation-service.mjs';

const run = promisify(execFile);
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;

test('오래된 행사 설정으로 닫힌 행사에 예약하거나 예전 가격을 저장하지 않는다', { skip: !passwordFile || !psql }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const query = async (sql) => (await run(psql, ['-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { env })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected, 'RIORIO_LOCAL_TEST_DATA_DIRECTORY is required');
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const slot = randomInt(1_000_000, 2_000_000_000);
  const event = `stale_${randomUUID().replaceAll('-', '')}`;
  await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,current_timestamp-interval '1 hour',current_timestamp+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot});`);
  const config = { status: 'booking_open', priceApproved: true, eventId: event, slotId: String(slot), opensAt: new Date(Date.now() - 3600000), closesAt: new Date(Date.now() + 3600000), slotStartsAt: new Date(Date.now() + 7200000), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [4], coursePrice: 1000, pairingPrice: 300 };
  const request = { eventId: event, slotId: String(slot), guests: 4, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: `request-${randomUUID()}`, recoveryToken: issueRecoveryToken() };
  const secret = randomBytes(32);
  const invalidKey = `invalid-guests-${randomUUID()}`;
  const invalidDigest = randomBytes(32).toString('hex');
  for (const guests of [0, 1, 5]) {
    assert.equal(await query(`select policy_fixture.book_with_expected_price('${event}',${slot},'${invalidKey}','fixture-hash',${guests},0,'v1','${invalidDigest}',current_timestamp+interval '1 hour',1000,300);`), 'invalid_guests');
  }
  assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${invalidKey}') || ':' || (select count(*) from policy_fixture.recovery_tokens where request_key='${invalidKey}') || ':' || (select count(*) from policy_fixture.price_snapshots where request_key='${invalidKey}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '0:0:0:0');
  const deps = { now: () => new Date(), recoverySecret: secret, loadTrustedConfig: async () => config, createAtomically: async ({ request: input, recoveryDigest }) => {
    await query(`update policy_fixture.events set is_open=false where id='${event}';`);
    return query(`select policy_fixture.book_with_expected_price('${event}',${slot},'${input.idempotencyKey}','fixture-hash',4,0,'v1','${recoveryDigest}',current_timestamp+interval '1 hour',1000,300);`);
  } };
  assert.equal((await createReservationService(request, deps)).status, 503);
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${request.idempotencyKey}';`), '0');

  const secondRequest = { ...request, idempotencyKey: `request-${randomUUID()}`, recoveryToken: issueRecoveryToken() };
  const secondDeps = { ...deps, createAtomically: async ({ request: input, recoveryDigest }) => {
    await query(`update policy_fixture.events set is_open=true, course_price=2000 where id='${event}';`);
    return query(`select policy_fixture.book_with_expected_price('${event}',${slot},'${input.idempotencyKey}','fixture-hash',4,0,'v1','${recoveryDigest}',current_timestamp+interval '1 hour',1000,300);`);
  } };
  assert.deepEqual(await createReservationService(secondRequest, secondDeps), { status: 409, body: { error: 'PRICE_CHANGED' } });
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${secondRequest.idempotencyKey}';`), '0');
});
