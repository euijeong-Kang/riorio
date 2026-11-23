import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { handleAdminCancelHttp } from '../src/reservation/admin-cancel-http.mjs';

const run = promisify(execFile);
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;

test('가상 관리자 취소 요청은 권한을 확인하고 취소와 감사를 함께 처리한다', { skip: !passwordFile || !psql }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const query = async (sql) => (await run(psql, ['-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { env })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected, 'RIORIO_LOCAL_TEST_DATA_DIRECTORY is required');
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const slot = randomInt(1_000_000, 2_000_000_000);
  const event = `admin_${randomUUID().replaceAll('-', '')}`;
  const booking = `admin-booking-${randomUUID()}`;
  const reservationId = randomUUID();
  const digest = randomBytes(32).toString('hex');
  await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,current_timestamp-interval '1 hour',current_timestamp+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into admin_fixture.grants values ('${event}','fixture-admin',true);`);
  assert.equal(await query(`select policy_fixture.book_with_recovery('${event}',${slot},'${booking}','fixture-hash',4,0,'v1','${digest}',current_timestamp+interval '1 hour');`), 'created');

  const request = () => new Request('http://localhost/admin/cancel', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer fixture-token' }, body: JSON.stringify({ reservationId, actorId: 'forged-admin' }) });
  const dependencies = {
    verifyAccessToken: async () => ({ id: 'fixture-admin' }),
    loadAdminGrant: async () => ({ active: true, userId: 'fixture-admin', eventId: event, role: 'event_admin' }),
    cancelWithAuditAtomically: async (input) => {
      assert.deepEqual(input, { eventId: event, reservationId, actorId: 'fixture-admin' });
      return query(`select admin_fixture.cancel_with_audit('${event}',${slot},'${booking}','fixture-admin');`);
    },
  };
  const denied = await handleAdminCancelHttp(request(), event, { ...dependencies, loadAdminGrant: async () => null });
  assert.equal(denied.status, 403);
  assert.equal(await query(`select state from allocation_fixture.bookings where request_key='${booking}';`), 'active');
  const cancelled = await handleAdminCancelHttp(request(), event, dependencies);
  assert.deepEqual(await cancelled.json(), { status: 'cancelled' });
  const repeated = await handleAdminCancelHttp(request(), event, dependencies);
  assert.deepEqual(await repeated.json(), { status: 'already_cancelled' });
  assert.equal(await query(`select count(*) from admin_fixture.audit_log where request_key='${booking}';`), '1');
  assert.equal(await query(`select count(*) from allocation_fixture.occupied_tables where slot_id=${slot};`), '0');

  const failureSlot = slot + 1;
  const failureBooking = `audit-failure-${randomUUID()}`;
  const failureDigest = randomBytes(32).toString('hex');
  await query(`insert into allocation_fixture.slots values (${failureSlot},4); insert into allocation_fixture.combinations values (${failureSlot},1,4,ARRAY['A','B']); insert into policy_fixture.event_slots values ('${event}',${failureSlot}); insert into admin_fixture.grants values ('${event}','fixture-audit-failure',true);`);
  assert.equal(await query(`select policy_fixture.book_with_recovery('${event}',${failureSlot},'${failureBooking}','fixture-hash',4,0,'v1','${failureDigest}',current_timestamp+interval '1 hour');`), 'created');
  const failureDeps = {
    verifyAccessToken: async () => ({ id: 'fixture-audit-failure' }),
    loadAdminGrant: async () => ({ active: true, userId: 'fixture-audit-failure', eventId: event, role: 'event_admin' }),
    cancelWithAuditAtomically: async () => query(`select admin_fixture.cancel_with_audit('${event}',${failureSlot},'${failureBooking}','fixture-audit-failure');`),
  };
  const failure = await handleAdminCancelHttp(request(), event, failureDeps);
  assert.equal(failure.status, 503);
  assert.deepEqual(await failure.json(), { error: 'SERVICE_UNAVAILABLE' });
  assert.equal(await query(`select state from allocation_fixture.bookings where request_key='${failureBooking}';`), 'active');
  assert.equal(await query(`select count(*) from allocation_fixture.occupied_tables where slot_id=${failureSlot};`), '2');
  assert.equal(await query(`select count(*) from admin_fixture.audit_log where request_key='${failureBooking}';`), '0');
});
