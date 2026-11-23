import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { handleAdminConfirmTransferHttp } from '../src/reservation/admin-confirm-transfer-http.mjs';

const run = promisify(execFile);
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;

for (const cancelFirst of [true, false]) test(cancelFirst ? '취소가 먼저 완료되면 입금 승인을 거부한다' : '입금 승인 후 취소해도 입금 기록을 환불로 취급하지 않는다', { skip: !psql || !passwordFile, timeout: 30000 }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const args = ['-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-qAt'];
  const query = async (sql, extra = {}) => (await run(psql, [...args, '-c', sql], { env: { ...env, ...extra }, timeout: 15000 })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected);
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);
  const suffix = randomUUID().replaceAll('-', '');
  const event = `transfer_${suffix}`;
  const key = `booking-${suffix}`;
  const slot = randomInt(1000000, 2000000000);
  const application = `transfer-race-${suffix}`;
  let holder;
  let blocked;
  let initialized = false;
  try {
    await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into admin_fixture.grants values ('${event}','fixture-admin',true), ('${event}','fixture-audit-failure',true); select allocation_fixture.book(${slot},'${key}','fixture',4); insert into transfer_fixture.payments values ('${key}','pending');`);
    initialized = true;
    assert.equal(await query(`select transfer_fixture.confirm_with_audit('${event}',${slot},'${key}','unknown');`), 'denied');
    await assert.rejects(query(`select transfer_fixture.confirm_with_audit('${event}',${slot},'${key}','fixture-audit-failure');`));
    assert.equal(await query(`select state from transfer_fixture.payments where request_key='${key}';`), 'pending');
    holder = spawn(psql, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    const ready = new Promise((resolve, reject) => {
      let output = '';
      holder.stdout.on('data', (chunk) => { output += chunk; if (output.includes('LOCK_ACQUIRED')) resolve(output); });
      holder.once('error', reject);
      holder.once('exit', (code) => { if (!output.includes('LOCK_ACQUIRED')) reject(new Error(`Lock holder exited: ${code}`)); });
    });
    const cancel = `select allocation_fixture.cancel(${slot},'${key}');`;
    const confirm = `select transfer_fixture.confirm_with_audit('${event}',${slot},'${key}','fixture-admin');`;
    holder.stdin.write(`begin; ${cancelFirst ? cancel : confirm} select 'LOCK_ACQUIRED';\n`);
    const output = await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Lock holder timeout')), 5000))]);
    assert.match(output, cancelFirst ? /cancelled/ : /confirmed/);
    blocked = query(cancelFirst ? confirm : cancel, { PGAPPNAME: application });
    let waiting = false;
    for (let attempt = 0; attempt < 40 && !waiting; attempt++) {
      waiting = (await query(`select count(*) from pg_stat_activity where application_name='${application}' and wait_event_type='Lock';`)) === '1';
      if (!waiting) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(waiting, true);
    holder.stdin.end('commit;\n');
    assert.equal(await blocked, cancelFirst ? 'not_eligible' : 'cancelled');
    blocked = undefined;
    assert.equal(await query(`select b.state || ':' || p.state || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot}) || ':' || (select count(*) from transfer_fixture.audit_log where request_key='${key}') from allocation_fixture.bookings b join transfer_fixture.payments p using(request_key) where b.request_key='${key}';`), cancelFirst ? 'cancelled:pending:0:0' : 'cancelled:confirmed:0:1');
    const reservationId = randomUUID();
    let adapterCalls = 0;
    const request = () => new Request('http://localhost/confirm-transfer', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer fixture' }, body: JSON.stringify({ reservationId, transferChecked: true }) });
    const dependencies = {
      verifyAccessToken: async () => ({ id: 'fixture-admin' }),
      loadAdminGrant: async () => ({ active: true, userId: 'fixture-admin', eventId: event, role: 'event_admin' }),
      confirmTransferWithAuditAtomically: async (input) => {
        adapterCalls++;
        assert.deepEqual(input, { eventId: event, reservationId, actorId: 'fixture-admin' });
        return query(confirm);
      },
    };
    const denied = await handleAdminConfirmTransferHttp(request(), event, { ...dependencies, loadAdminGrant: async () => null });
    assert.equal(denied.status, 403);
    assert.equal(adapterCalls, 0);
    const response = await handleAdminConfirmTransferHttp(request(), event, dependencies);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: 'NOT_ELIGIBLE' });
    assert.equal(adapterCalls, 1);
    assert.equal(await query(`select count(*) from transfer_fixture.audit_log where request_key='${key}';`), cancelFirst ? '0' : '1');
  } finally {
    if (holder && holder.exitCode === null) holder.kill();
    if (blocked) await blocked.catch(() => {});
    if (initialized) await query(`delete from transfer_fixture.audit_log where request_key='${key}'; delete from transfer_fixture.payments where request_key='${key}'; delete from allocation_fixture.occupied_tables where slot_id=${slot}; delete from allocation_fixture.bookings where request_key='${key}'; delete from admin_fixture.grants where event_id='${event}'; delete from policy_fixture.event_slots where slot_id=${slot} and event_id='${event}'; delete from policy_fixture.events where id='${event}'; delete from allocation_fixture.combinations where slot_id=${slot}; delete from allocation_fixture.slots where id=${slot};`);
  }
});
