import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { handleAdminSlotChangeHttp } from '../src/reservation/admin-slot-change-http.mjs';

const run = promisify(execFile);
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;

for (const scenario of ['slot-first', 'booking-first', 'revoke-first', 'change-first', 'deadline', 'allocation-deadline', 'key-deadline', 'cancel-first', 'full-before-cancel']) test(({ 'slot-first': '회차 변경이 먼저 잠기면 예약은 변경된 시작 시각을 검증한다', 'booking-first': '예약이 먼저 잠기면 회차 변경은 대기 후 거부된다', 'revoke-first': '관리자 권한 회수가 먼저 잠기면 회차 변경은 대기 후 거부된다', 'change-first': '회차 변경이 먼저 권한을 잠그면 권한 회수는 변경 완료까지 대기한다', deadline: '회차 잠금 대기 중 접수 마감이 지나면 예약을 거부한다', 'allocation-deadline': '좌석 잠금 대기 중 접수 마감이 지나면 예약을 거부한다', 'key-deadline': '요청 키 잠금 대기 중 접수 마감이 지나면 예약을 거부한다', 'cancel-first': '취소가 먼저 좌석을 잠그면 새 예약은 취소 완료 후 좌석을 확보한다', 'full-before-cancel': '마감된 좌석을 먼저 확인한 예약은 취소 후 재시도할 수 있다' })[scenario], { skip: !psql || !passwordFile, timeout: 30000 }, async () => {
  const bookingFirst = scenario === 'booking-first';
  const revokeFirst = scenario === 'revoke-first';
  const changeFirst = scenario === 'change-first';
  const deadline = ['deadline', 'allocation-deadline', 'key-deadline'].includes(scenario);
  const cancelFirst = scenario === 'cancel-first';
  const fullBeforeCancel = scenario === 'full-before-cancel';
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const args = ['-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-qAt'];
  const query = async (sql, extra = {}) => (await run(psql, [...args, '-c', sql], { env: { ...env, ...extra }, timeout: 15000 })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected);
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const suffix = randomUUID().replaceAll('-', '');
  const schema = `slot_race_${suffix}`;
  const event = `event_${suffix}`;
  const key = `booking-${suffix}`;
  const previousKey = `previous-${suffix}`;
  const slot = randomInt(1_000_000, 2_000_000_000);
  const digest = randomBytes(32).toString('hex');
  const application = `slot-race-${suffix}`;
  const fixture = await readFile(new URL('./fixtures/reservation-slot-start-transaction.sql', import.meta.url), 'utf8');
  const definition = fixture.slice(fixture.indexOf('CREATE TABLE policy_fixture.test_slot_starts'), fixture.indexOf('\nINSERT INTO allocation_fixture.slots'))
    .replaceAll('policy_fixture.test_slot_starts', `${schema}.test_slot_starts`)
    .replaceAll('policy_fixture.test_book_with_slot_start', `${schema}.test_book_with_slot_start`)
    .replaceAll('policy_fixture.test_change_slot', `${schema}.test_change_slot`)
    .replaceAll('policy_fixture.test_slot_audit', `${schema}.test_slot_audit`);
  let holder;
  let blocked;
  let initialized = false;
  try {
    await query(`create schema ${schema}; ${definition} insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into ${schema}.test_slot_starts values (${slot},clock_timestamp()+interval '2 hours'); insert into admin_fixture.grants values ('${event}','fixture-admin',true),('${event}','fixture-audit-failure',true),('${event}','fixture-disabled',false);`);
    initialized = true;
    if (cancelFirst || fullBeforeCancel) assert.equal(await query(`select ${schema}.test_book_with_slot_start('${event}',${slot},'${previousKey}','${randomBytes(32).toString('hex')}');`), 'created');
    if (deadline) await query(`update policy_fixture.events set closes_at=clock_timestamp()+interval '5 seconds' where id='${event}';`);
    if (scenario === 'slot-first') {
      const change = async (actor, startsAt) => {
        const request = new Request('http://localhost/admin/slot', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer fixture' }, body: JSON.stringify({ slotId: String(slot), startsAt }) });
        return handleAdminSlotChangeHttp(request, event, {
          verifyAccessToken: async () => ({ id: actor }),
          loadAdminGrant: async () => ({ active: true, userId: actor, eventId: event, role: 'event_admin' }),
          changeSlotWithAuditAtomically: async () => query(`select ${schema}.test_change_slot_with_audit('${event}',${slot},'${startsAt}','${actor}');`),
        });
      };
      const original = await query(`select extract(epoch from starts_at) from ${schema}.test_slot_starts where slot_id=${slot};`);
      const proposed = new Date(Date.now() + 10800000).toISOString();
      const denied = await change('fixture-disabled', proposed);
      assert.equal(denied.status, 403);
      const failedAudit = await change('fixture-audit-failure', proposed);
      assert.equal(failedAudit.status, 503);
      assert.equal(await query(`select extract(epoch from starts_at) from ${schema}.test_slot_starts where slot_id=${slot};`), original);
      assert.equal(await query(`select count(*) from ${schema}.test_slot_audit;`), '0');
      const changed = await change('fixture-admin', proposed);
      assert.equal(changed.status, 200);
      assert.equal(await query(`select count(*) from ${schema}.test_slot_audit where actor_id='fixture-admin' and slot_id=${slot};`), '1');
      assert.equal(await query(`select (starts_at = '${proposed}'::timestamptz)::text from ${schema}.test_slot_starts where slot_id=${slot};`), 'true');
    }
    holder = spawn(psql, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    const ready = new Promise((resolve, reject) => {
      let output = '';
      holder.stdout.on('data', (chunk) => { output += chunk; if (output.includes('LOCK_ACQUIRED')) resolve(output); });
      holder.once('error', reject);
      holder.once('exit', (code) => { if (!output.includes('LOCK_ACQUIRED')) reject(new Error(`Lock holder exited: ${code}`)); });
    });
    const booking = `select ${schema}.test_book_with_slot_start('${event}',${slot},'${key}','${digest}');`;
    const update = `update ${schema}.test_slot_starts set starts_at=clock_timestamp()+interval '30 minutes' where slot_id=${slot};`;
    const revoke = `update admin_fixture.grants set active=false where event_id='${event}' and actor_id='fixture-admin';`;
    const change = `select ${schema}.test_change_slot_with_audit('${event}',${slot},clock_timestamp()+interval '3 hours','fixture-admin');`;
    const cancel = `select allocation_fixture.cancel(${slot},'${previousKey}');`;
    const holdSlot = scenario === 'key-deadline' ? `select pg_advisory_xact_lock(hashtextextended('${key}',0));` : scenario === 'allocation-deadline' ? `select 1 from allocation_fixture.slots where id=${slot} for update;` : `select 1 from ${schema}.test_slot_starts where slot_id=${slot} for update;`;
    holder.stdin.write(`begin; ${bookingFirst || fullBeforeCancel ? booking : revokeFirst ? revoke : changeFirst ? change : deadline ? holdSlot : cancelFirst ? cancel : update} select 'LOCK_ACQUIRED';\n`);
    const output = await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Lock holder timeout')), 5000))]);
    if (bookingFirst) assert.match(output, /created/);
    if (changeFirst) assert.match(output, /changed/);
    if (cancelFirst) assert.match(output, /cancelled/);
    if (fullBeforeCancel) assert.match(output, /sold_out/);
    if (bookingFirst || revokeFirst) {
      const startsAt = new Date(Date.now() + 10800000).toISOString();
      const request = new Request('http://localhost/admin/slot', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer fixture' }, body: JSON.stringify({ slotId: String(slot), startsAt, actorId: 'forged' }) });
      const dependencies = {
        verifyAccessToken: async () => ({ id: 'fixture-admin' }),
        loadAdminGrant: async () => ({ active: true, userId: 'fixture-admin', eventId: event, role: 'event_admin' }),
        changeSlotWithAuditAtomically: async (input) => {
          assert.deepEqual(input, { eventId: event, slotId: String(slot), startsAt, actorId: 'fixture-admin' });
          return query(`select ${schema}.test_change_slot_with_audit('${event}',${slot},'${startsAt}','fixture-admin');`, { PGAPPNAME: application });
        },
      };
      blocked = handleAdminSlotChangeHttp(request, event, dependencies).then(async (response) => ({ status: response.status, body: await response.json() }));
    } else if (fullBeforeCancel) {
      blocked = query(cancel, { PGAPPNAME: application });
    } else if (changeFirst) {
      blocked = query(revoke, { PGAPPNAME: application });
    } else {
      blocked = query(booking, { PGAPPNAME: application });
    }
    let waiting = false;
    for (let attempt = 0; attempt < 40 && !waiting; attempt++) {
      waiting = (await query(`select count(*) from pg_stat_activity where application_name='${application}' and wait_event_type='Lock';`)) === '1';
      if (!waiting) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(waiting, true, 'The competing transaction must wait for the lock holder');
    if (deadline) await query('select pg_sleep(5.5);');
    holder.stdin.end('commit;\n');
    if (bookingFirst) assert.deepEqual(await blocked, { status: 409, body: { error: 'HAS_BOOKINGS' } });
    else if (revokeFirst) assert.deepEqual(await blocked, { status: 403, body: { error: 'ACCESS_DENIED' } });
    else if (changeFirst) assert.equal(await blocked, '');
    else if (cancelFirst) assert.equal(await blocked, 'created');
    else if (fullBeforeCancel) assert.equal(await blocked, 'cancelled');
    else assert.equal(await blocked, 'closed');
    blocked = undefined;
    assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), bookingFirst || cancelFirst ? '1:2' : '0:0');
    if (cancelFirst) assert.equal(await query(`select state from allocation_fixture.bookings where request_key='${previousKey}';`), 'cancelled');
    if (fullBeforeCancel) {
      assert.equal(await query(`select state from allocation_fixture.bookings where request_key='${previousKey}';`), 'cancelled');
      assert.equal(await query(booking), 'created');
      assert.equal(await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}' and state='active') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot});`), '1:2');
    }
    if (deadline) assert.equal(await query(`select (select count(*) from policy_fixture.recovery_tokens where request_key='${key}') || ':' || (select count(*) from policy_fixture.price_snapshots where request_key='${key}');`), '0:0');
    if (bookingFirst || revokeFirst) {
      assert.equal(await query(`select (starts_at > clock_timestamp()+interval '1 hour')::text from ${schema}.test_slot_starts where slot_id=${slot};`), 'true');
      assert.equal(await query(`select count(*) from ${schema}.test_slot_audit;`), '0');
    }
    if (changeFirst) {
      assert.equal(await query(`select (starts_at > clock_timestamp()+interval '2 hours 30 minutes')::text from ${schema}.test_slot_starts where slot_id=${slot};`), 'true');
      assert.equal(await query(`select count(*) from ${schema}.test_slot_audit where actor_id='fixture-admin' and slot_id=${slot};`), '1');
      assert.equal(await query(`select active::text from admin_fixture.grants where event_id='${event}' and actor_id='fixture-admin';`), 'false');
    }
  } finally {
    if (holder && holder.exitCode === null) holder.kill();
    if (blocked) await blocked.catch(() => {});
    if (initialized) await query(`drop schema ${schema} cascade; delete from policy_fixture.recovery_tokens where request_key in ('${key}','${previousKey}'); delete from policy_fixture.price_snapshots where request_key in ('${key}','${previousKey}'); delete from allocation_fixture.occupied_tables where slot_id=${slot}; delete from allocation_fixture.bookings where request_key in ('${key}','${previousKey}'); delete from admin_fixture.grants where event_id='${event}' and actor_id in ('fixture-admin','fixture-audit-failure','fixture-disabled'); delete from policy_fixture.event_slots where slot_id=${slot} and event_id='${event}'; delete from policy_fixture.events where id='${event}'; delete from allocation_fixture.combinations where slot_id=${slot}; delete from allocation_fixture.slots where id=${slot};`);
  }
});
