import { calculatePrice } from './policy.mjs';

export function createPriceSnapshot({ guests, pairingGuests, coursePrice, pairingPrice, depositPerReservation }) {
  const total = calculatePrice({ guests, pairingGuests, coursePrice, pairingPrice });
  if (!Number.isSafeInteger(depositPerReservation) || depositPerReservation < 0 || depositPerReservation > total) throw new RangeError('Invalid deposit');
  return Object.freeze({ guests, pairingGuests, coursePrice, pairingPrice, total, deposit: depositPerReservation, remaining: total - depositPerReservation });
}
