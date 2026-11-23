const conflictStates = Object.freeze({
  REQUEST_STATUS_REQUIRED: 'status-required',
  REQUEST_CONFLICT: 'request-conflict',
  SOLD_OUT: 'soldout-error',
  PRICE_CHANGED: 'price-changed',
  DEPOSIT_CHANGED: 'deposit-changed',
  TERMS_CHANGED: 'terms-changed',
});

export async function interpretSubmissionResponse(response) {
  try {
    if (!response || typeof response.json !== 'function') return 'unavailable';
    const body = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1) return 'unavailable';
    if (response.status === 202 && body.status === 'received') return 'received';
    if (response.status === 409 && typeof body.error === 'string' && Object.hasOwn(conflictStates, body.error)) return conflictStates[body.error];
  } catch {
    return 'unavailable';
  }
  return 'unavailable';
}
