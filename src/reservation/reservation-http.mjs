import { createReservationService } from './create-reservation-service.mjs';

const MAX_BODY_BYTES = 8192;
const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

export function respond(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export async function readBody(request) {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)) throw new RangeError('Request too large');
  if (!request.body) throw new SyntaxError('Missing body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let value = '';
  let finished = false;
  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      size += chunk.byteLength;
      if (size > MAX_BODY_BYTES) throw new RangeError('Request too large');
      value += decoder.decode(chunk, { stream: true });
    }
    return JSON.parse(value + decoder.decode());
  } finally {
    if (!finished) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function handleReservationHttp(request, dependencies) {
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  if (!dependencies || typeof dependencies.checkRateLimit !== 'function') return respond(503, { error: 'BOOKING_UNAVAILABLE' });
  try {
    if (await dependencies.checkRateLimit(request) !== true) return respond(429, { error: 'BOOKING_UNAVAILABLE' });
  } catch {
    return respond(503, { error: 'BOOKING_UNAVAILABLE' });
  }
  let body;
  try {
    body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SyntaxError('Invalid body');
  } catch (error) {
    return respond(error instanceof RangeError ? 413 : 400, { error: error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' });
  }
  const result = await createReservationService(body, dependencies);
  return respond(result.status, result.body);
}
