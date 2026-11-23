import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { issueRecoveryToken } from '../src/reservation/recovery-token.mjs';

const run = promisify(execFile);
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;

test('격리된 가상 DB에서 동시 요청과 재전송을 확인한다', { skip: !passwordFile || !psql }, async () => {
  const password = await readFile(passwordFile, 'utf8');
  const env = { ...process.env, PGPASSWORD: password };
  const query = async (sql) => {
    const { stdout } = await run(psql, ['-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { env });
    return stdout.trim();
  };
  const identity = await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');");
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected, 'RIORIO_LOCAL_TEST_DATA_DIRECTORY is required');
  assert.equal(identity.replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const slot = randomInt(1_000_000, 2_000_000_000);
  const key = `integration-${randomUUID()}`;
  await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']);`);
  const sql = `select allocation_fixture.book(${slot},'${key}','fixture-hash',4);`;
  const results = await Promise.all([query(sql), query(sql)]);
  assert.deepEqual(results.sort(), ['created', 'replay']);
  assert.equal(await query(`select allocation_fixture.book(${slot},'${key}','different-hash',4);`), 'conflict');
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${key}';`), '1');
  assert.equal(await query(`select count(*) from allocation_fixture.occupied_tables where slot_id=${slot};`), '2');

  const sourceSlot = slot + 1;
  const destinationSlot = slot + 2;
  const raceKey = `race-${randomUUID()}`;
  await query(`insert into allocation_fixture.slots values (${sourceSlot},4),(${destinationSlot},4); insert into allocation_fixture.combinations values (${sourceSlot},1,4,ARRAY['A','B']),(${destinationSlot},1,4,ARRAY['A','B']);`);
  assert.equal(await query(`select allocation_fixture.book(${sourceSlot},'${raceKey}','fixture-hash',4);`), 'created');
  const race = await Promise.all([
    query(`select allocation_fixture.move('${raceKey}',${sourceSlot},${destinationSlot});`),
    query(`select allocation_fixture.cancel(${sourceSlot},'${raceKey}');`),
  ]);
  assert.equal(race.filter((result) => result === 'moved' || result === 'cancelled').length, 1);
  assert.equal(race.filter((result) => result === 'not_found').length, 1);
  const valid = await query(`select case when b.state='cancelled' and count(o.table_id)=0 then 'valid' when b.state='active' and b.slot_id=${destinationSlot} and count(o.table_id)=2 and bool_and(o.slot_id=${destinationSlot}) then 'valid' else 'invalid' end from allocation_fixture.bookings b left join allocation_fixture.occupied_tables o on o.booking_id=b.id where b.request_key='${raceKey}' group by b.id;`);
  assert.equal(valid, 'valid');

  const rollbackSlot = slot + 3;
  const rollbackKey = `rollback-${randomUUID()}`;
  await query(`insert into allocation_fixture.slots values (${rollbackSlot},4); insert into allocation_fixture.combinations values (${rollbackSlot},1,4,ARRAY['A','B']);`);
  await query(`begin; select allocation_fixture.book(${rollbackSlot},'${rollbackKey}','fixture-hash',4); rollback;`);
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${rollbackKey}';`), '0');
  assert.equal(await query(`select count(*) from allocation_fixture.occupied_tables where slot_id=${rollbackSlot};`), '0');

  const httpSlot = slot + 4;
  const httpKey = `http-${randomUUID()}`;
  await query(`insert into allocation_fixture.slots values (${httpSlot},4); insert into allocation_fixture.combinations values (${httpSlot},1,4,ARRAY['A','B']);`);
  const config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [4], coursePrice: 1000, pairingPrice: 300 };
  const body = { eventId: 'fixture', slotId: 'slot', guests: 4, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', idempotencyKey: httpKey, recoveryToken: issueRecoveryToken(), total: 1 };
  const dependencies = {
    checkRateLimit: async () => true,
    recoverySecret: Buffer.alloc(32, 7),
    now: () => new Date('2026-01-01T12:00:00Z'),
    loadTrustedConfig: async () => config,
    createAtomically: async ({ total }) => {
      assert.equal(total, 4000);
      return query(`select allocation_fixture.book(${httpSlot},'${httpKey}','fixture-hash',4);`);
    },
  };
  const httpRequest = () => new Request('http://localhost/reservation', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const responses = await Promise.all([handleReservationHttp(httpRequest(), dependencies), handleReservationHttp(httpRequest(), dependencies)]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [202, 409]);
  const bodies = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(bodies.map((body) => body.status ?? body.error).sort(), ['REQUEST_STATUS_REQUIRED', 'received']);
  assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${httpKey}';`), '1');
  assert.equal(await query(`select count(*) from allocation_fixture.occupied_tables where slot_id=${httpSlot};`), '2');
});
