import { clearAttempt, loadOrCreateAttempt, markAttemptSubmitted } from './attempt-session.mjs';
import { recoverSubmittedAttempt } from './recover-attempt.mjs';

if (import.meta.env.DEV) {
  const eventId = 'browser-fixture-v2';
  const key = `riorio.reservation.attempt.v1.${eventId}`;
  const status = document.getElementById('status');
  const prepare = document.getElementById('prepare');
  const restore = document.getElementById('restore');
  const mark = document.getElementById('mark');
  const discard = document.getElementById('discard');
  const recoverReceived = document.getElementById('recover-received');
  const recoverConfirmed = document.getElementById('recover-confirmed');
  const recoverCancelled = document.getElementById('recover-cancelled');
  const recoverUnavailable = document.getElementById('recover-unavailable');
  prepare.addEventListener('click', () => {
    try {
      loadOrCreateAttempt(eventId, window.sessionStorage, window.crypto);
      status.textContent = '가상 시도 준비됨';
    } catch {
      status.textContent = '저장할 수 없습니다';
    }
  });
  restore.addEventListener('click', () => {
    try {
      if (window.sessionStorage.getItem(key) === null) {
        status.textContent = '저장된 가상 시도가 없습니다';
        return;
      }
      loadOrCreateAttempt(eventId, window.sessionStorage, window.crypto);
      status.textContent = '저장된 가상 시도 복원됨';
    } catch {
      status.textContent = '복원할 수 없습니다';
    }
  });
  mark.addEventListener('click', () => {
    try {
      markAttemptSubmitted(eventId, window.sessionStorage);
      status.textContent = '가상 전송 가능성 표시됨 · 실제 전송 없음';
    } catch {
      status.textContent = '가상 전송 상태를 저장할 수 없습니다';
    }
  });
  discard.addEventListener('click', () => {
    try {
      clearAttempt(eventId, window.sessionStorage);
      status.textContent = '준비 중인 가상 정보 삭제됨';
    } catch {
      status.textContent = '전송 가능성이 있거나 상태를 확인할 수 없어 삭제하지 않았습니다';
    }
  });
  recoverReceived.addEventListener('click', async () => {
    const result = await recoverSubmittedAttempt(eventId, window.sessionStorage, async () => Response.json({ status: 'received' }));
    if (result.status === 'superseded') return;
    status.textContent = result.status === 'received' ? '가상 접수 확인 예시 · 실제 예약 아님' : '가상 상태를 확인할 수 없습니다';
  });
  recoverConfirmed.addEventListener('click', async () => {
    const result = await recoverSubmittedAttempt(eventId, window.sessionStorage, async () => Response.json({ status: 'confirmed' }));
    if (result.status === 'superseded') return;
    status.textContent = result.status === 'confirmed' ? '가상 확정 확인 예시 · 실제 예약 아님' : '가상 상태를 확인할 수 없습니다';
  });
  recoverCancelled.addEventListener('click', async () => {
    const result = await recoverSubmittedAttempt(eventId, window.sessionStorage, async () => Response.json({ status: 'cancelled' }));
    if (result.status === 'superseded') return;
    status.textContent = result.status === 'cancelled' ? '가상 취소 확인 예시 · 실제 예약 아님' : '가상 상태를 확인할 수 없습니다';
  });
  recoverUnavailable.addEventListener('click', async () => {
    const result = await recoverSubmittedAttempt(eventId, window.sessionStorage, async () => new Response(null, { status: 404 }));
    if (result.status === 'superseded') return;
    status.textContent = result.status === 'unavailable' ? '가상 확인 불가 예시 · 미접수를 의미하지 않습니다' : '가상 응답이 예상과 다릅니다';
  });
}
