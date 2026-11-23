export const EVENT_TIME_ZONE = 'Asia/Seoul';
export const DINING_MINUTES = 100;
export const CLEARING_MINUTES = 20;
export const MIN_GUESTS_PER_RESERVATION = 2;
export const MAX_GUESTS_PER_RESERVATION = 4;
export const DEFAULT_GUESTS = 2;
export const TRANSFER_DEADLINE_HOURS = 2;

export function calculateTransferDeadline(receivedAt) {
  if (!(receivedAt instanceof Date) || !Number.isFinite(receivedAt.getTime())) throw new TypeError('Invalid received time');
  const deadline = new Date(receivedAt.getTime() + TRANSFER_DEADLINE_HOURS * 60 * 60 * 1000);
  if (!Number.isFinite(deadline.getTime())) throw new RangeError('Invalid transfer deadline');
  return deadline;
}

export function calculatePerGuestDeposit(guests, depositPerGuest) {
  if (!Number.isSafeInteger(guests) || guests < MIN_GUESTS_PER_RESERVATION || guests > MAX_GUESTS_PER_RESERVATION || !Number.isSafeInteger(depositPerGuest) || depositPerGuest < 0) throw new RangeError('Invalid deposit');
  const deposit = guests * depositPerGuest;
  if (!Number.isSafeInteger(deposit)) throw new RangeError('Invalid deposit');
  return deposit;
}

export function calculateSlotTimes(start) {
  if (!(start instanceof Date) || !Number.isFinite(start.getTime())) throw new TypeError('Invalid start time');
  const diningEndsAt = new Date(start.getTime() + DINING_MINUTES * 60_000);
  const clearingEndsAt = new Date(diningEndsAt.getTime() + CLEARING_MINUTES * 60_000);
  return { diningEndsAt, clearingEndsAt };
}

export function calculatePrice({ guests, pairingGuests, coursePrice, pairingPrice }) {
  if (!Number.isSafeInteger(guests) || guests < 1 || guests > MAX_GUESTS_PER_RESERVATION) throw new RangeError('Invalid guest count');
  if (!Number.isSafeInteger(pairingGuests) || pairingGuests < 0 || pairingGuests > guests) throw new RangeError('Invalid pairing count');
  if (!Number.isSafeInteger(coursePrice) || coursePrice < 0 || !Number.isSafeInteger(pairingPrice) || pairingPrice < 0) throw new RangeError('Invalid price');
  const total = guests * coursePrice + pairingGuests * pairingPrice;
  if (!Number.isSafeInteger(total)) throw new RangeError('Invalid total');
  return total;
}

export function isBookingConfigured(config) {
  return Boolean(config && config.status === 'booking_open' && config.eventId && config.slotId &&
    config.opensAt instanceof Date && Number.isFinite(config.opensAt.getTime()) &&
    config.closesAt instanceof Date && Number.isFinite(config.closesAt.getTime()) &&
    config.opensAt < config.closesAt && config.slotStartsAt instanceof Date && Number.isFinite(config.slotStartsAt.getTime()) &&
    config.closesAt <= config.slotStartsAt && typeof config.termsVersion === 'string' && config.termsVersion.trim() !== '' && config.termsApproved === true &&
    config.depositConfirmed === true && Number.isSafeInteger(config.depositPerGuest) && config.depositPerGuest >= 0 && typeof config.depositVersion === 'string' && config.depositVersion.trim() !== '' &&
    config.priceApproved === true && Number.isSafeInteger(config.coursePrice) && config.coursePrice >= 0 && Number.isSafeInteger(config.pairingPrice) && config.pairingPrice >= 0 &&
    Number.isSafeInteger(config.capacity) && config.capacity > 0 &&
    Number.isInteger(config.minimumGuests) && config.minimumGuests >= MIN_GUESTS_PER_RESERVATION && config.minimumGuests <= MAX_GUESTS_PER_RESERVATION &&
    Array.isArray(config.allowedGuestCounts) && config.allowedGuestCounts.length > 0 &&
    config.allowedGuestCounts.every((count) => Number.isInteger(count) && count >= config.minimumGuests && count <= MAX_GUESTS_PER_RESERVATION && count <= config.capacity));
}

export function selectTableCombination({ guests, allowedGuestCounts, capacity, occupiedGuests, combinations, occupiedTableIds }) {
  if (!Number.isSafeInteger(guests) || guests < MIN_GUESTS_PER_RESERVATION || guests > MAX_GUESTS_PER_RESERVATION ||
      !Array.isArray(allowedGuestCounts) || !allowedGuestCounts.includes(guests)) return null;
  if (!Number.isSafeInteger(capacity) || capacity < 1 || !Number.isSafeInteger(occupiedGuests) || occupiedGuests < 0 || occupiedGuests + guests > capacity) return null;
  if (!Array.isArray(combinations) || !Array.isArray(occupiedTableIds)) return null;
  if (occupiedTableIds.some((id) => typeof id !== 'string' || !id.trim() || id !== id.trim())) return null;
  const occupied = new Set(occupiedTableIds);
  for (const combination of combinations) {
    if (!combination || typeof combination !== 'object' || !Array.isArray(combination.tableIds) || combination.tableIds.length === 0 ||
        combination.tableIds.some((id) => typeof id !== 'string' || !id.trim() || id !== id.trim()) ||
        new Set(combination.tableIds).size !== combination.tableIds.length ||
        !Array.isArray(combination.guestCounts) || !combination.guestCounts.includes(guests)) continue;
    if (combination.tableIds.every((id) => !occupied.has(id))) return [...combination.tableIds];
  }
  return null;
}
