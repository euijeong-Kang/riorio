import type { ChristmasReservation } from './christmas-admin-api.mjs';
export function summarizeReservations(rows: ChristmasReservation[]): { activeCount: number; totalGuests: number; confirmedGuests: number; pendingGuests: number; revenue: number; groups: [string, ChristmasReservation[]][] };
