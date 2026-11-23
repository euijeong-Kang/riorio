import { authorizeEventAdmin } from './admin-authorization.mjs';
import { readBody, respond } from './reservation-http.mjs';

export async function handleAdminConfirmTransferHttp(request, eventId, dependencies) {
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  const authorization = await authorizeEventAdmin(request.headers.get('authorization'), eventId, dependencies);
  if (!authorization.ok) return respond(authorization.status, { error: authorization.status === 400 ? 'INVALID_REQUEST' : authorization.status === 503 ? 'SERVICE_UNAVAILABLE' : 'ACCESS_DENIED' });
  if (typeof dependencies.confirmTransferWithAuditAtomically !== 'function') return respond(503, { error: 'SERVICE_UNAVAILABLE' });

  let body;
  try {
    body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.reservationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.reservationId) || body.transferChecked !== true) throw new SyntaxError('Invalid request');
  } catch (error) {
    return respond(error instanceof RangeError ? 413 : 400, { error: error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' });
  }

  try {
    const result = await dependencies.confirmTransferWithAuditAtomically({ eventId: authorization.eventId, reservationId: body.reservationId, actorId: authorization.principalId });
    if (result === 'confirmed' || result === 'already_confirmed') return respond(200, { status: result });
    if (result === 'not_found') return respond(404, { error: 'NOT_FOUND' });
    if (result === 'not_eligible') return respond(409, { error: 'NOT_ELIGIBLE' });
    return respond(503, { error: 'SERVICE_UNAVAILABLE' });
  } catch {
    return respond(503, { error: 'SERVICE_UNAVAILABLE' });
  }
}
