import { createRoot } from 'react-dom/client';
import { ReservationPreview } from './ReservationPreview';

if (import.meta.env.DEV) {
  const root = document.getElementById('root');
  if (root) createRoot(root).render(<ReservationPreview />);
}
