import { readBody, respond } from './reservation-http.mjs';
import { recoveryStatus, recoveryTokenDigest } from './recovery-token.mjs';

export async function handleRecoveryHttp(request, dependencies) {
  if (request.method !== 'POST') return respond(405, { error: 'METHOD_NOT_ALLOWED' });
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') ?? '')) return respond(415, { error: 'UNSUPPORTED_MEDIA_TYPE' });
  if (!dependencies || typeof dependencies.checkRateLimit !== 'function' || typeof dependencies.lookupByDigest !== 'function' || typeof dependencies.now !== 'function') return respond(503, { error: 'RECOVERY_UNAVAILABLE' });
  try {
    if (await dependencies.checkRateLimit(request) !== true) return respond(429, { error: 'RECOVERY_UNAVAILABLE' });
  } catch {
    return respond(503, { error: 'RECOVERY_UNAVAILABLE' });
  }

  let body;
  try {
    body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.token !== 'string') throw new SyntaxError('Invalid request');
  } catch (error) {
    return respond(error instanceof RangeError ? 413 : 400, { error: error instanceof RangeError ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' });
  }

  try {
    const digest = recoveryTokenDigest(body.token, dependencies.secret);
    const record = await dependencies.lookupByDigest(digest);
    const now = dependencies.now();
    if (!record || !(record.expiresAt instanceof Date) || !Number.isFinite(record.expiresAt.getTime()) || !(now instanceof Date) || !Number.isFinite(now.getTime()) || record.expiresAt <= now || record.revoked !== false) return respond(404, { error: 'RECOVERY_UNAVAILABLE' });
    const result = recoveryStatus(body.token, record.digest, dependencies.secret, record.status);
    return result.error ? respond(404, result) : respond(200, result);
  } catch (error) {
    if (error instanceof TypeError && typeof body.token === 'string' && !/^[A-Za-z0-9_-]{43}$/.test(body.token)) return respond(404, { error: 'RECOVERY_UNAVAILABLE' });
    return respond(503, { error: 'RECOVERY_UNAVAILABLE' });
  }
}
