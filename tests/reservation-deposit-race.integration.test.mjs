import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;

for (const bookingFirst of [false, true]) test(bookingFirst ? '예약금 변경은 먼저 진행된 예약과 스냅샷 저장을 기다린다' : '예약금 변경이 먼저 진행되면 이전 조건의 예약을 거부한다', { skip: !psql || !passwordFile, timeout: 30000 }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const args = ['-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-qAt'];
  const query = async (sql, extra = {}) => (await run(psql, [...args, '-c', sql], { env: { ...env, ...extra }, timeout: 15000 })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected);
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const suffix = randomUUID().replaceAll('-', '');
  const schema = `deposit_race_${suffix}`;
  const event = `deposit_${suffix}`;
  const key = `booking-${suffix}`;
  const slot = randomInt(1_000_000, 2_000_000_000);
  const digest = randomBytes(32).toString('hex');
  const application = `deposit-race-${suffix}`;
  const fixture = await readFile(new URL('./fixtures/reservation-deposit-transaction.sql', import.meta.url), 'utf8');
  const definition = fixture.slice(fixture.indexOf('CREATE TABLE policy_fixture.test_deposit_settings'), fixture.indexOf('\nINSERT INTO allocation_fixture.slots'))
    .replaceAll('policy_fixture.test_deposit_settings', `${schema}.test_deposit_settings`)
    .replaceAll('policy_fixture.test_deposit_snapshots', `${schema}.test_deposit_snapshots`)
    .replaceAll('policy_fixture.test_book_with_deposit', `${schema}.test_book_with_deposit`);
  let holder;
  let blocked;
  let initialized = false;
  try {
    await query(`create schema ${schema}; ${definition} insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot}); insert into ${schema}.test_deposit_settings values ('${event}',true,500,'v1');`);
    initialized = true;
    holder = spawn(psql, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    const ready = new Promise((resolve, reject) => {
      let output = '';
      holder.stdout.on('data', (chunk) => { output += chunk; if (output.includes('LOCK_ACQUIRED')) resolve(output); });
      holder.once('error', reject);
      holder.once('exit', (code) => { if (!output.includes('LOCK_ACQUIRED')) reject(new Error(`Lock holder exited: ${code}`)); });
    });
    const booking = `select ${schema}.test_book_with_deposit('${event}',${slot},'${key}','${digest}',500,'v1');`;
    const update = `update ${schema}.test_deposit_settings set amount=600, version='v2' where event_id='${event}';`;
    holder.stdin.write(`begin; ${bookingFirst ? booking : update} select 'LOCK_ACQUIRED';\n`);
    const output = await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Lock holder timeout')), 5000))]);
    if (bookingFirst) assert.match(output, /created/);
    blocked = query(bookingFirst ? update : booking, { PGAPPNAME: application });
    let waiting = false;
    for (let attempt = 0; attempt < 40 && !waiting; attempt++) {
      waiting = (await query(`select count(*) from pg_stat_activity where application_name='${application}' and wait_event_type='Lock';`)) === '1';
      if (!waiting) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(waiting, true);
    holder.stdin.end('commit;\n');
    assert.equal(await blocked, bookingFirst ? '' : 'deposit_changed');
    blocked = undefined;
    const counts = await query(`select (select count(*) from allocation_fixture.bookings where request_key='${key}') || ':' || (select count(*) from allocation_fixture.occupied_tables where slot_id=${slot}) || ':' || (select count(*) from ${schema}.test_deposit_snapshots where request_key='${key}' and amount=500 and version='v1');`);
    assert.equal(counts, bookingFirst ? '1:2:1' : '0:0:0');
    assert.equal(await query(`select amount || ':' || version from ${schema}.test_deposit_settings where event_id='${event}';`), '600:v2');
  } finally {
    if (holder && holder.exitCode === null) holder.kill();
    if (blocked) await blocked.catch(() => {});
    if (initialized) await query(`drop schema ${schema} cascade; delete from policy_fixture.recovery_tokens where request_key='${key}'; delete from policy_fixture.price_snapshots where request_key='${key}'; delete from allocation_fixture.occupied_tables where slot_id=${slot}; delete from allocation_fixture.bookings where request_key='${key}'; delete from policy_fixture.event_slots where slot_id=${slot} and event_id='${event}'; delete from policy_fixture.events where id='${event}'; delete from allocation_fixture.combinations where slot_id=${slot}; delete from allocation_fixture.slots where id=${slot};`);
  }
});
