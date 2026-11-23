import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID, webcrypto } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { loadOrCreateAttempt } from '../src/reservation/attempt-session.mjs';
import { recoveryTokenDigest } from '../src/reservation/recovery-token.mjs';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';

const run = promisify(execFile);
const passwordFile = process.env.RIORIO_LOCAL_TEST_PGPASSWORD_FILE;
const psql = process.env.RIORIO_LOCAL_TEST_PSQL;

test('로컬 HTTP 응답 연결이 끊겨도 사전 토큰으로 접수 상태를 복구한다', { skip: !passwordFile || !psql }, async () => {
  const env = { ...process.env, PGPASSWORD: await readFile(passwordFile, 'utf8') };
  const query = async (sql) => (await run(psql, ['-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { env })).stdout.trim();
  const expected = process.env.RIORIO_LOCAL_TEST_DATA_DIRECTORY?.replaceAll('\\', '/').replace(/\/$/, '');
  assert.ok(expected, 'RIORIO_LOCAL_TEST_DATA_DIRECTORY is required');
  assert.equal((await query("select current_database() || ':' || current_user || ':' || current_setting('data_directory');")).replaceAll('\\', '/'), `riorio_reservation_fixture:riorio_test:${expected}`);

  const slot = randomInt(1_000_000, 2_000_000_000);
  const event = `network_${randomUUID().replaceAll('-', '')}`;
  await query(`insert into allocation_fixture.slots values (${slot},4); insert into allocation_fixture.combinations values (${slot},1,4,ARRAY['A','B']); insert into policy_fixture.events values ('${event}',true,current_timestamp-interval '1 hour',current_timestamp+interval '1 hour','v1',1000,300); insert into policy_fixture.event_slots values ('${event}',${slot});`);
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const attempt = loadOrCreateAttempt(event, storage, webcrypto);
  const secret = randomBytes(32);
  const config = { status: 'booking_open', priceApproved: true, eventId: event, slotId: String(slot), opensAt: new Date(Date.now() - 3600000), closesAt: new Date(Date.now() + 3600000), slotStartsAt: new Date(Date.now() + 7200000), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [4], coursePrice: 1000, pairingPrice: 300 };
  const body = { eventId: event, slotId: String(slot), guests: 4, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1', ...attempt };
  const tokenDigest = recoveryTokenDigest(attempt.recoveryToken, secret);
  const createDeps = { checkRateLimit: async () => true, now: () => new Date(), recoverySecret: secret, loadTrustedConfig: async () => config, createAtomically: async ({ recoveryDigest, fingerprint }) => { assert.equal(recoveryDigest, tokenDigest); assert.match(fingerprint, /^[a-f0-9]{64}$/); return query(`select policy_fixture.book_with_recovery('${event}',${slot},'${attempt.idempotencyKey}','${fingerprint}',4,0,'v1','${recoveryDigest}',current_timestamp+interval '1 hour');`); } };
  const recoveryDeps = { secret, now: () => new Date(), checkRateLimit: async () => true, lookupByDigest: async (digest) => {
    const raw = await query(`select json_build_object('digest',token_digest,'status',policy_fixture.recover(token_digest),'expiresAt',expires_at,'revoked',revoked)::text from policy_fixture.recovery_tokens where token_digest='${digest}';`);
    if (!raw) return null;
    const record = JSON.parse(raw);
    return { ...record, expiresAt: new Date(record.expiresAt) };
  } };

  const server = createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(`http://localhost${incoming.url}`, { method: incoming.method, headers: incoming.headers, body: Readable.toWeb(incoming), duplex: 'half' });
      const response = incoming.url === '/reservation' ? await handleReservationHttp(request, createDeps) : await handleRecoveryHttp(request, recoveryDeps);
      if (incoming.url === '/reservation' && response.status === 202) {
        outgoing.destroy();
        return;
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(await response.text());
    } catch {
      outgoing.destroy();
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (path, payload) => fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    await assert.rejects(post('/reservation', body));
    await query(`update policy_fixture.events set is_open=false where id='${event}';`);
    config.status = 'draft';
    assert.equal((await post('/reservation', body)).status, 503);
    const restored = loadOrCreateAttempt(event, storage, webcrypto);
    const response = await post('/recovery', { token: restored.recoveryToken });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'received' });
    assert.equal(await query(`select count(*) from allocation_fixture.bookings where request_key='${attempt.idempotencyKey}';`), '1');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
