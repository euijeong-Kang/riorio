const VALUE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const EVENT_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

function storageKey(eventId) {
  if (typeof eventId !== 'string' || !EVENT_PATTERN.test(eventId)) throw new TypeError('Invalid event identifier');
  return `riorio.reservation.attempt.v1.${eventId}`;
}

function randomValue(cryptoApi) {
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') throw new Error('Secure randomness unavailable');
  const bytes = cryptoApi.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function parseAttempt(raw) {
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === 'object' && typeof value.idempotencyKey === 'string' && typeof value.recoveryToken === 'string' && VALUE_PATTERN.test(value.idempotencyKey) && VALUE_PATTERN.test(value.recoveryToken)) {
      const phase = value.phase === 'prepared' || value.phase === 'submitted' ? value.phase : 'unknown';
      return { idempotencyKey: value.idempotencyKey, recoveryToken: value.recoveryToken, phase };
    }
  } catch {
    return null;
  }
  return null;
}

export function loadOrCreateAttempt(eventId, storage, cryptoApi) {
  const key = storageKey(eventId);
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw new Error('Session storage unavailable');
  const existing = storage.getItem(key);
  if (existing !== null) {
    const attempt = parseAttempt(existing);
    if (!attempt) throw new Error('Stored attempt is invalid');
    return { idempotencyKey: attempt.idempotencyKey, recoveryToken: attempt.recoveryToken };
  }
  const attempt = { idempotencyKey: randomValue(cryptoApi), recoveryToken: randomValue(cryptoApi) };
  if (attempt.idempotencyKey === attempt.recoveryToken) throw new Error('Unable to generate independent attempt credentials');
  storage.setItem(key, JSON.stringify({ ...attempt, phase: 'prepared' }));
  const stored = parseAttempt(storage.getItem(key));
  if (!stored || stored.phase !== 'prepared' || stored.idempotencyKey !== attempt.idempotencyKey || stored.recoveryToken !== attempt.recoveryToken) throw new Error('Could not retain attempt');
  return { idempotencyKey: stored.idempotencyKey, recoveryToken: stored.recoveryToken };
}

export function markAttemptSubmitted(eventId, storage) {
  const key = storageKey(eventId);
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw new Error('Session storage unavailable');
  const attempt = parseAttempt(storage.getItem(key));
  if (!attempt || attempt.phase === 'unknown') throw new Error('Attempt state is unavailable');
  if (attempt.phase === 'submitted') return;
  if (attempt.idempotencyKey === attempt.recoveryToken) throw new Error('Attempt credentials must be independent');
  storage.setItem(key, JSON.stringify({ ...attempt, phase: 'submitted' }));
  const stored = parseAttempt(storage.getItem(key));
  if (!stored || stored.phase !== 'submitted' || stored.idempotencyKey !== attempt.idempotencyKey || stored.recoveryToken !== attempt.recoveryToken) throw new Error('Could not retain submitted attempt');
}

export function getAttemptPhase(eventId, storage) {
  const key = storageKey(eventId);
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Session storage unavailable');
  const raw = storage.getItem(key);
  if (raw === null) return 'missing';
  const attempt = parseAttempt(raw);
  return attempt ? attempt.phase : 'unknown';
}

export function loadExistingAttempt(eventId, storage) {
  const key = storageKey(eventId);
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Session storage unavailable');
  const raw = storage.getItem(key);
  if (raw === null) return null;
  const attempt = parseAttempt(raw);
  if (!attempt) throw new Error('Stored attempt is invalid');
  return { idempotencyKey: attempt.idempotencyKey, recoveryToken: attempt.recoveryToken };
}

export function clearAttempt(eventId, storage) {
  const key = storageKey(eventId);
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.removeItem !== 'function') throw new Error('Session storage unavailable');
  const raw = storage.getItem(key);
  if (raw === null) return;
  const attempt = parseAttempt(raw);
  if (!attempt || attempt.phase !== 'prepared') throw new Error('Attempt may have been submitted');
  storage.removeItem(key);
}
