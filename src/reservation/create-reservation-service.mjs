import { createHmac } from 'node:crypto';
import { validateReservationRequest } from './request-validation.mjs';
import { recoveryTokenDigest } from './recovery-token.mjs';
import { canonicalReservationRequest } from './idempotency.mjs';

export async function createReservationService(request, dependencies) {
  if (!dependencies || typeof dependencies.loadTrustedConfig !== 'function' || typeof dependencies.createAtomically !== 'function' || typeof dependencies.now !== 'function') {
    return { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } };
  }
  if (!request || typeof request.eventId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(request.eventId) || typeof request.slotId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(request.slotId)) {
    return { status: 400, body: { error: 'INVALID_SLOT' } };
  }

  let config;
  try {
    config = await dependencies.loadTrustedConfig(request.eventId, request.slotId);
  } catch {
    return { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } };
  }

  let validation;
  try {
    validation = validateReservationRequest(request, config, dependencies.now());
  } catch {
    return { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } };
  }
  if (!validation.ok) {
    return { status: validation.error === 'BOOKING_CLOSED' ? 503 : ['PRICE_CHANGED', 'TERMS_CHANGED', 'DEPOSIT_CHANGED'].includes(validation.error) ? 409 : 400, body: { error: validation.error } };
  }

  if (typeof request.recoveryToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(request.recoveryToken) || request.recoveryToken === request.idempotencyKey) {
    return { status: 400, body: { error: 'INVALID_RECOVERY_TOKEN' } };
  }

  try {
    const recoveryDigest = recoveryTokenDigest(request.recoveryToken, dependencies.recoverySecret);
    const safeRequest = { eventId: request.eventId, slotId: request.slotId, guests: request.guests, pairingGuests: request.pairingGuests, name: request.name, phone: request.phone, email: request.email, requests: request.requests, termsVersion: request.termsVersion, termsAccepted: request.termsAccepted, expectedCoursePrice: request.expectedCoursePrice, expectedPairingPrice: request.expectedPairingPrice, expectedDeposit: request.expectedDeposit, expectedDepositVersion: request.expectedDepositVersion, idempotencyKey: request.idempotencyKey };
    const fingerprint = createHmac('sha256', dependencies.recoverySecret).update('riorio-reservation-request-v1:').update(canonicalReservationRequest(safeRequest)).digest('hex');
    const result = await dependencies.createAtomically({ request: safeRequest, fingerprint, recoveryDigest, config, total: validation.total });
    if (result === 'created') return { status: 202, body: { status: 'received' } };
    if (result === 'replay') return { status: 409, body: { error: 'REQUEST_STATUS_REQUIRED' } };
    if (result === 'conflict') return { status: 409, body: { error: 'REQUEST_CONFLICT' } };
    if (result === 'sold_out') return { status: 409, body: { error: 'SOLD_OUT' } };
    if (result === 'price_changed') return { status: 409, body: { error: 'PRICE_CHANGED' } };
    if (result === 'deposit_changed') return { status: 409, body: { error: 'DEPOSIT_CHANGED' } };
    if (result === 'terms_changed') return { status: 409, body: { error: 'TERMS_CHANGED' } };
    if (result === 'terms_not_accepted') return { status: 400, body: { error: 'TERMS_NOT_ACCEPTED' } };
    return { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } };
  } catch {
    return { status: 503, body: { error: 'BOOKING_UNAVAILABLE' } };
  }
}
