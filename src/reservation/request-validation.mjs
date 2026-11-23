import { calculatePerGuestDeposit, isBookingConfigured, MAX_GUESTS_PER_RESERVATION } from './policy.mjs';
import { createPriceSnapshot } from './price-snapshot.mjs';

export function validateReservationRequest(request, config, now) {
  if (!isBookingConfigured(config) || !(now instanceof Date) || !Number.isFinite(now.getTime()) || now < config.opensAt || now >= config.closesAt) return { ok: false, error: 'BOOKING_CLOSED' };
  if (!request || request.eventId !== config.eventId || request.slotId !== config.slotId) return { ok: false, error: 'INVALID_SLOT' };
  if (!Number.isSafeInteger(request.guests) || request.guests < config.minimumGuests || request.guests > MAX_GUESTS_PER_RESERVATION || !config.allowedGuestCounts.includes(request.guests)) return { ok: false, error: 'INVALID_GUESTS' };
  if (!Number.isSafeInteger(request.pairingGuests) || request.pairingGuests < 0 || request.pairingGuests > request.guests) return { ok: false, error: 'INVALID_PAIRING' };
  if (typeof request.name !== 'string' || !request.name.trim() || request.name.length > 80 || /[\r\n]/.test(request.name) || typeof request.phone !== 'string' || request.phone.length > 32 || !/^[0-9]{10,11}$/.test(request.phone.replace(/[\s-]/g, ''))) return { ok: false, error: 'INVALID_CUSTOMER' };
  if (request.email != null && (typeof request.email !== 'string' || request.email.length > 254 || (request.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)))) return { ok: false, error: 'INVALID_EMAIL' };
  if (request.requests != null && (typeof request.requests !== 'string' || request.requests.length > 500)) return { ok: false, error: 'INVALID_REQUESTS' };
  if (request.termsVersion !== config.termsVersion) return { ok: false, error: 'TERMS_CHANGED' };
  if (request.termsAccepted !== true) return { ok: false, error: 'TERMS_NOT_ACCEPTED' };
  if (!Number.isSafeInteger(request.expectedCoursePrice) || !Number.isSafeInteger(request.expectedPairingPrice) || request.expectedCoursePrice < 0 || request.expectedPairingPrice < 0) return { ok: false, error: 'INVALID_PRICE_CONFIRMATION' };
  if (request.expectedCoursePrice !== config.coursePrice || request.expectedPairingPrice !== config.pairingPrice) return { ok: false, error: 'PRICE_CHANGED' };
  if (!Number.isSafeInteger(request.expectedDeposit) || request.expectedDeposit < 0 || typeof request.expectedDepositVersion !== 'string' || !request.expectedDepositVersion.trim()) return { ok: false, error: 'INVALID_DEPOSIT_CONFIRMATION' };
  let deposit;
  try {
    deposit = calculatePerGuestDeposit(request.guests, config.depositPerGuest);
  } catch {
    return { ok: false, error: 'BOOKING_CLOSED' };
  }
  if (request.expectedDeposit !== deposit || request.expectedDepositVersion !== config.depositVersion) return { ok: false, error: 'DEPOSIT_CHANGED' };
  if (typeof request.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(request.idempotencyKey)) return { ok: false, error: 'INVALID_REQUEST_KEY' };
  try {
    const snapshot = createPriceSnapshot({ guests: request.guests, pairingGuests: request.pairingGuests, coursePrice: config.coursePrice, pairingPrice: config.pairingPrice, depositPerReservation: deposit });
    return { ok: true, total: snapshot.total };
  } catch {
    return { ok: false, error: 'BOOKING_CLOSED' };
  }
}
