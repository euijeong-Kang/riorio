export function confirmFictionalTransfer(reservation, checked) {
  if (!reservation || reservation.status !== 'pending' || checked !== true) return reservation;
  return { ...reservation, status: 'confirmed' };
}
