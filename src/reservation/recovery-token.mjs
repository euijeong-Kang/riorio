import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function requireSecret(secret) {
  if (!Buffer.isBuffer(secret) || secret.length < 32) throw new TypeError('Recovery secret must contain at least 32 bytes');
}

export function issueRecoveryToken() {
  return randomBytes(32).toString('base64url');
}

export function recoveryTokenDigest(token, secret) {
  requireSecret(secret);
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) throw new TypeError('Invalid recovery token');
  return createHmac('sha256', secret).update('riorio-reservation-recovery-v1:').update(token).digest('hex');
}

export function verifyRecoveryToken(token, storedDigest, secret) {
  requireSecret(secret);
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token) || typeof storedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(storedDigest)) return false;
  const actual = Buffer.from(recoveryTokenDigest(token, secret), 'hex');
  const expected = Buffer.from(storedDigest, 'hex');
  return timingSafeEqual(actual, expected);
}

export function recoveryStatus(token, storedDigest, secret, status) {
  if (!verifyRecoveryToken(token, storedDigest, secret) || !['received', 'confirmed', 'cancelled'].includes(status)) return { error: 'RECOVERY_UNAVAILABLE' };
  return { status };
}
