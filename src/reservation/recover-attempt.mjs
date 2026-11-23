import { getAttemptPhase, loadExistingAttempt } from './attempt-session.mjs';

const activeRecoveries = new WeakMap();

export async function recoverSubmittedAttempt(eventId, storage, recover) {
  if (typeof recover !== 'function' || !storage || (typeof storage !== 'object' && typeof storage !== 'function')) return { status: 'unavailable' };
  let active = activeRecoveries.get(storage);
  if (!active) {
    active = new Map();
    activeRecoveries.set(storage, active);
  }
  const request = {};
  active.set(eventId, request);
  try {
    const phase = getAttemptPhase(eventId, storage);
    if (phase !== 'submitted' && phase !== 'unknown') return { status: 'unavailable' };
    const attempt = loadExistingAttempt(eventId, storage);
    if (!attempt) return { status: 'unavailable' };
    const response = await recover({ token: attempt.recoveryToken });
    if (active.get(eventId) !== request) return { status: 'superseded' };
    if (!response || response.status !== 200 || typeof response.json !== 'function') return { status: 'unavailable' };
    const body = await response.json();
    if (active.get(eventId) !== request) return { status: 'superseded' };
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !['received', 'confirmed', 'cancelled'].includes(body.status)) return { status: 'unavailable' };
    const currentPhase = getAttemptPhase(eventId, storage);
    const currentAttempt = loadExistingAttempt(eventId, storage);
    if ((currentPhase !== 'submitted' && currentPhase !== 'unknown') || !currentAttempt || currentAttempt.idempotencyKey !== attempt.idempotencyKey || currentAttempt.recoveryToken !== attempt.recoveryToken) return { status: 'unavailable' };
    return { status: body.status };
  } catch {
    return { status: active.get(eventId) === request ? 'unavailable' : 'superseded' };
  } finally {
    if (active.get(eventId) === request) active.delete(eventId);
  }
}
