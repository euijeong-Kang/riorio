import { submitPreparedAttempt } from './submit-attempt.mjs';
import { interpretSubmissionResponse } from './interpret-submission-response.mjs';

export async function submitAndInterpret(eventId, payload, storage, cryptoApi, submit, timeoutMs = 15000) {
  if (typeof submit !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) return 'unavailable';
  const controller = new AbortController();
  let timer;
  try {
    const operation = submitPreparedAttempt(eventId, payload, storage, cryptoApi, (body) => submit(body, controller.signal)).then(interpretSubmissionResponse);
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => { controller.abort(); resolve('unavailable'); }, timeoutMs);
    });
    return await Promise.race([operation, timeout]);
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timer);
  }
}
