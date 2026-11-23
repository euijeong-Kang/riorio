type ReservationPaymentActionsProps = {
  status: string;
  onMarkPaid: () => void;
  onApprove: () => void;
  disabled?: boolean;
};

export function ReservationPaymentActions({ status, onMarkPaid, onApprove, disabled = false }: ReservationPaymentActionsProps) {
  return <>
    {status === 'pending' && <button type="button" onClick={onMarkPaid} disabled={disabled} className="px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors whitespace-nowrap disabled:opacity-50">입금확인</button>}
    {(status === 'pending' || status === 'paid') && <button type="button" onClick={onApprove} disabled={disabled} className="px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-200 transition-colors whitespace-nowrap disabled:opacity-50">승인</button>}
  </>;
}
