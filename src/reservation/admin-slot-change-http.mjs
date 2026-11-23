import { authorizeEventAdmin } from './admin-authorization.mjs';
import { readBody, respond } from './reservation-http.mjs';

export async function handleAdminSlotChangeHttp(request, eventId, dependencies) {
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  const authorization = await authorizeEventAdmin(request.headers.get('authorization'), eventId, dependencies);
  if (!authorization.ok) return respond(authorization.status, { error: authorization.status === 400 ? 'INVALID_REQUEST' : authorization.status === 503 ? 'SERVICE_UNAVAILABLE' : 'ACCESS_DENIED' });
  if (typeof dependencies.changeSlotWithAuditAtomically !== 'function') return respond(503, { error: 'SERVICE_UNAVAILABLE' });

  let body;
  try {
    body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.slotId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(body.slotId) || typeof body.startsAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.startsAt)) throw new SyntaxError('Invalid request');
    const startsAt = new Date(body.startsAt);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.toISOString() !== body.startsAt) throw new SyntaxError('Invalid request');
  } catch (error) {
    return respond(error instanceof RangeError ? 413 : 400, { error: error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' });
  }

  try {
    const result = await dependencies.changeSlotWithAuditAtomically({ eventId: authorization.eventId, slotId: body.slotId, startsAt: body.startsAt, actorId: authorization.principalId });
    if (result === 'changed') return respond(200, { status: 'changed' });
    if (result === 'has_bookings') return respond(409, { error: 'HAS_BOOKINGS' });
    if (result === 'invalid_start') return respond(400, { error: 'INVALID_START' });
    if (result === 'denied') return respond(403, { error: 'ACCESS_DENIED' });
    return respond(503, { error: 'SERVICE_UNAVAILABLE' });
  } catch {
    return respond(503, { error: 'SERVICE_UNAVAILABLE' });
  }
}
