import { ChristmasReservationForm } from './ChristmasReservationForm';
import { useChristmasBookingOpen } from './useChristmasBookingOpen';

export default function ChristmasReservationPage({ english = false }: { english?: boolean }) {
  const open = useChristmasBookingOpen(true);
  if (!open) return <main className="christmas-reservation-form"><h1>{english ? 'Reservations coming soon' : '예약 준비 중'}</h1><p>{english ? 'Reservation details are being prepared.' : '예약 안내를 준비하고 있습니다.'}</p></main>;
  return <main><ChristmasReservationForm english={english} /></main>;
}
