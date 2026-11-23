import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { submitAndInterpret } from '../src/reservation/submit-and-interpret.mjs';
import { recoverSubmittedAttempt } from '../src/reservation/recover-attempt.mjs';
import { clearAttempt } from '../src/reservation/attempt-session.mjs';
import { handleReservationHttp } from '../src/reservation/reservation-http.mjs';
import { handleRecoveryHttp } from '../src/reservation/recovery-http.mjs';

test('로컬 HTTP 응답 유실 후 복구하고 재전송을 차단한다', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const secret = randomBytes(32);
  const now = () => new Date('2026-01-01T12:00:00Z');
  const config = { status: 'booking_open', priceApproved: true, eventId: 'fixture', slotId: 'slot', opensAt: new Date('2026-01-01T00:00:00Z'), closesAt: new Date('2026-01-02T00:00:00Z'), slotStartsAt: new Date('2026-01-03T00:00:00Z'), termsVersion: 'v1', termsApproved: true, depositPerGuest: 0, depositConfirmed: true, depositVersion: 'deposit-v1', capacity: 4, minimumGuests: 2, allowedGuestCounts: [2], coursePrice: 1000, pairingPrice: 300 };
  const payload = { eventId: 'fixture', slotId: 'slot', guests: 2, pairingGuests: 0, name: '가상 고객', phone: '010-0000-0000', termsVersion: 'v1', termsAccepted: true, expectedCoursePrice: 1000, expectedPairingPrice: 300, expectedDeposit: 0, expectedDepositVersion: 'deposit-v1' };
  let record;
  let writes = 0;
  let requestError;
  let responseStatus;
  const createDependencies = { now, recoverySecret: secret, checkRateLimit: async () => true, loadTrustedConfig: async () => config, createAtomically: async ({ recoveryDigest }) => { writes++; record = { digest: recoveryDigest, status: 'received', expiresAt: new Date('2026-01-03T00:00:00Z'), revoked: false }; return 'created'; } };
  const recoveryDependencies = { now, secret, checkRateLimit: async () => true, lookupByDigest: async (digest) => digest === record?.digest ? record : null };
  const server = createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(`http://127.0.0.1${incoming.url}`, { method: incoming.method, headers: incoming.headers, body: Readable.toWeb(incoming), duplex: 'half' });
      if (incoming.url === '/reservation') {
        const response = await handleReservationHttp(request, createDependencies);
        responseStatus = response.status;
        if (response.status === 202) { outgoing.destroy(); return; }
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
      } else if (incoming.url === '/recovery') {
        const response = await handleRecoveryHttp(request, recoveryDependencies);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
      } else {
        outgoing.writeHead(404).end();
      }
    } catch (error) {
      requestError = error;
      outgoing.destroy();
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch((error) => { requestError = error; throw error; });
    assert.equal(await submitAndInterpret('fixture', payload, storage, webcrypto, (body) => post('/reservation', body)), 'unavailable');
    assert.equal(writes, 1, `가상 저장 후 응답 연결이 끊어져야 합니다 (HTTP: ${responseStatus ?? '없음'}, 오류: ${requestError?.cause?.message ?? requestError?.message ?? '없음'})`);
    let retries = 0;
    assert.equal(await submitAndInterpret('fixture', payload, storage, webcrypto, async () => { retries++; }), 'unavailable');
    assert.equal(retries, 0);
    assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, (body) => post('/recovery', body)), { status: 'received' });
    assert.throws(() => clearAttempt('fixture', storage));
    config.coursePrice = 2000;
    record.revoked = true;
    assert.deepEqual(await recoverSubmittedAttempt('fixture', storage, (body) => post('/recovery', body)), { status: 'unavailable' });
    assert.equal(await submitAndInterpret('fixture', payload, storage, webcrypto, async () => { retries++; }), 'unavailable');
    assert.equal(retries, 0);
    assert.throws(() => clearAttempt('fixture', storage));
    assert.equal(writes, 1);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
