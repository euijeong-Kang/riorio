import { getAttemptPhase, loadOrCreateAttempt, markAttemptSubmitted } from './attempt-session.mjs';

const inFlight = new WeakMap();

export async function submitPreparedAttempt(eventId, payload, storage, cryptoApi, submit) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.eventId !== eventId || typeof submit !== 'function' || !storage || (typeof storage !== 'object' && typeof storage !== 'function')) throw new TypeError('Invalid submission');
  let active = inFlight.get(storage);
  if (!active) {
    active = new Set();
    inFlight.set(storage, active);
  }
  if (active.has(eventId)) throw new Error('Submission already in progress');
  active.add(eventId);
  try {
    const attempt = loadOrCreateAttempt(eventId, storage, cryptoApi);
    if (getAttemptPhase(eventId, storage) !== 'prepared') throw new Error('Attempt status must be checked before retry');
    markAttemptSubmitted(eventId, storage);
    return await submit({ ...payload, ...attempt });
  } finally {
    active.delete(eventId);
  }
}
