export function canonicalReservationRequest(request) {
  if (!request || typeof request.eventId !== 'string' || typeof request.slotId !== 'string' ||
      !Number.isSafeInteger(request.guests) || !Number.isSafeInteger(request.pairingGuests) ||
      typeof request.name !== 'string' || typeof request.phone !== 'string' ||
      typeof request.termsVersion !== 'string' || request.termsAccepted !== true || !Number.isSafeInteger(request.expectedCoursePrice) || !Number.isSafeInteger(request.expectedPairingPrice) || !Number.isSafeInteger(request.expectedDeposit) || typeof request.expectedDepositVersion !== 'string') throw new TypeError('Invalid reservation request');
  return JSON.stringify({
    eventId: request.eventId,
    slotId: request.slotId,
    guests: request.guests,
    pairingGuests: request.pairingGuests,
    name: request.name.trim(),
    phone: request.phone.replace(/[\s-]/g, ''),
    email: typeof request.email === 'string' ? request.email.trim() : '',
    requests: typeof request.requests === 'string' ? request.requests.trim() : '',
    termsVersion: request.termsVersion,
    termsAccepted: true,
    expectedCoursePrice: request.expectedCoursePrice,
    expectedPairingPrice: request.expectedPairingPrice,
    expectedDeposit: request.expectedDeposit,
    expectedDepositVersion: request.expectedDepositVersion,
  });
}

export function resolveIdempotency(existing, fingerprint, proof) {
  if (typeof fingerprint !== 'string' || !fingerprint) throw new TypeError('Invalid fingerprint');
  if (!existing) return { action: 'create' };
  try {
    if (!proof || !(proof.now instanceof Date) || !Number.isFinite(proof.now.getTime()) || !(existing.expiresAt instanceof Date) || !Number.isFinite(existing.expiresAt.getTime()) || existing.expiresAt <= proof.now || existing.revoked !== false || !verifyRecoveryToken(proof.token, existing.recoveryDigest, proof.secret)) return { action: 'unavailable' };
  } catch {
    return { action: 'unavailable' };
  }
  if (existing.fingerprint !== fingerprint) return { action: 'conflict' };
  if (existing.state === 'complete' && typeof existing.reservationId === 'string' && existing.reservationId) return { action: 'replay', reservationId: existing.reservationId };
  return { action: 'pending' };
}
import { verifyRecoveryToken } from './recovery-token.mjs';

