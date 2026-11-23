import { handleReservationHttp, respond } from './reservation-http.mjs';
import { handleRecoveryHttp } from './recovery-http.mjs';
import { handleAdminConfirmTransferHttp } from './admin-confirm-transfer-http.mjs';
import { handleAdminCancelHttp } from './admin-cancel-http.mjs';

export async function handleEventReservationRequest(request, dependencies) {
  const match = new URL(request.url).pathname.match(/^\/api\/events\/([A-Za-z0-9_-]{1,80})\/(reservations|recovery|admin\/confirm-transfer|admin\/cancel)$/);
  if (!match) return respond(404, { error: 'NOT_FOUND' });
  const [, eventId, action] = match;
  if (action === 'reservations') {
    if (dependencies?.bookingEnabled !== true || typeof dependencies.reservations?.loadTrustedConfig !== 'function') return respond(503, { error: 'BOOKING_UNAVAILABLE' });
    const reservationDependencies = dependencies.reservations;
    return handleReservationHttp(request, { ...reservationDependencies, loadTrustedConfig: (requestedEventId, slotId) => requestedEventId === eventId ? reservationDependencies.loadTrustedConfig(eventId, slotId) : null });
  }
  if (action === 'recovery') {
    const recoveryDependencies = dependencies?.recovery;
    if (typeof recoveryDependencies?.lookupByDigest !== 'function') return respond(503, { error: 'RECOVERY_UNAVAILABLE' });
    return handleRecoveryHttp(request, { ...recoveryDependencies, lookupByDigest: async (digest) => {
      const record = await recoveryDependencies.lookupByDigest(digest);
      return record?.eventId === eventId ? record : null;
    } });
  }
  if (action === 'admin/confirm-transfer') return handleAdminConfirmTransferHttp(request, eventId, dependencies?.admin);
  return handleAdminCancelHttp(request, eventId, dependencies?.admin);
}
