const key = 'riorio.christmas2026.reservation.submitted';

export function readReservationReference(): string | null {
  const saved = localStorage.getItem(key);
  if (saved) return saved;
  const previous = sessionStorage.getItem(key);
  if (previous) localStorage.setItem(key, previous);
  return previous;
}

export function saveReservationReference(reference: string) {
  localStorage.setItem(key, reference);
  if (localStorage.getItem(key) !== reference) throw new Error('Storage unavailable');
}

export function removeReservationReference(reference: string) {
  if (localStorage.getItem(key) === reference) localStorage.removeItem(key);
  if (sessionStorage.getItem(key) === reference) sessionStorage.removeItem(key);
}
