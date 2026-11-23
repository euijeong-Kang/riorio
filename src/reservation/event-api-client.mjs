const EVENT_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function createEventReservationClient({ eventId, baseUrl, fetchImpl = globalThis.fetch }) {
  if (typeof eventId !== 'string' || !EVENT_ID.test(eventId)) throw new TypeError('Invalid event ID');
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/') || baseUrl.startsWith('//') || /[?#\\]/.test(baseUrl)) throw new TypeError('Invalid API base path');
  if (typeof fetchImpl !== 'function') throw new TypeError('Fetch unavailable');
  const root = `${baseUrl.replace(/\/+$/, '')}/events/${eventId}`;
  const post = (path, body, signal) => fetchImpl(`${root}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    body: JSON.stringify(body),
    signal,
  });
  return {
    submit: (body, signal) => {
      if (!body || body.eventId !== eventId) throw new TypeError('Event mismatch');
      return post('reservations', body, signal);
    },
    recover: (body, signal) => post('recovery', body, signal),
  };
}
