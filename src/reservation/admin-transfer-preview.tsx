import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReservationPaymentActions } from '../pages/admin/ReservationPaymentActions';
import { christmas } from '../pages/public/event';
import { calculatePerGuestDeposit } from './policy.mjs';
import { confirmFictionalTransfer } from './admin-transfer-preview-model.mjs';
import '../index.css';

function AdminTransferPreview() {
  const [checked, setChecked] = useState(false);
  const [reservation, setReservation] = useState({ status: 'pending' });
  const approved = reservation.status === 'confirmed';
  const deposit = calculatePerGuestDeposit(2, christmas.depositPerGuest);
  return <main className="min-h-screen bg-gray-50 p-6 text-gray-900"><div className="mx-auto max-w-2xl space-y-4"><h1 className="text-2xl font-bold">관리자 입금 확인 · 가상 시안</h1><p>가상 데이터만 표시합니다. 실제 입금 확인, 예약 승인, 저장 및 API 요청은 수행하지 않습니다.</p><section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"><h2 className="font-semibold">가상 신청 · 2인</h2><p>가상 예약금 ₩{deposit.toLocaleString('ko-KR')} · 실제 계좌 및 고객 정보 없음</p><p role="status">{approved ? '가상 상태: 승인됨 · 실제 예약 아님' : '가상 상태: 입금 확인 대기'}</p><label className="mr-3"><input type="checkbox" checked={checked} disabled={approved} onChange={(event) => setChecked(event.target.checked)} /> 가상 입금 확인 예시를 확인했습니다</label><ReservationPaymentActions status={approved ? 'approved' : 'paid'} disabled={!checked} onMarkPaid={() => {}} onApprove={() => setReservation(confirmFictionalTransfer(reservation, checked))} /></section></div></main>;
}

if (import.meta.env.DEV) {
  const root = document.getElementById('preview');
  if (root) createRoot(root).render(<AdminTransferPreview />);
}
