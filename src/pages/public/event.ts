export type EventStatus = 'draft' | 'announced' | 'booking_open' | 'sold_out' | 'closed' | 'ended';
export type EventConfig = {
  status: EventStatus;
  dates: readonly string[] | null;
  startTimes: readonly string[] | null;
  capacity: number | null;
  deposit: number | null;
  reservationTerms: string | null;
  priceApproved: boolean;
  coursePrice: number;
  pairingPrice: number;
};

export const christmas = {
  id: 'christmas-2026',
  year: 2026,
  status: 'draft',
  dates: null,
  startTimes: null,
  capacity: null,
  deposit: null,
  reservationTerms: null,
  priceApproved: false,
  coursePrice: 120000,
  pairingPrice: 40000,
  durationHours: 2,
  courses: [
    ['아뮤즈', '크로케타스', 'Amuse', 'Croquetas'],
    ['콜드 애피타이저', '하몽·뽈뽀 세비체', 'Cold appetizer', 'Jamón and octopus ceviche'],
    ['핫 애피타이저', '파타타스 브라바스', 'Hot appetizer', 'Patatas bravas'],
    ['수프', '비프 콘소메 또는 버섯 콘소메 (검토 중)', 'Soup', 'Beef or mushroom consommé (under review)'],
    ['생선', '꿀대구', 'Fish', 'Honey-glazed cod'],
    ['메인', '이베리코', 'Main', 'Ibérico pork'],
    ['라이스', '해물밥', 'Rice', 'Seafood rice'],
    ['디저트', '바스크 치즈케이크·그라니사도', 'Dessert', 'Basque cheesecake and granizado'],
  ],
} as const satisfies EventConfig;

export const totalPrice = (event: EventConfig) => event.coursePrice + event.pairingPrice;
export const canAcceptReservations = (event: EventConfig) =>
  event.status === 'booking_open' && event.priceApproved &&
  !!event.dates?.length && !!event.startTimes?.length &&
  event.capacity !== null && event.capacity > 0 && event.deposit !== null &&
  !!event.reservationTerms?.trim();

export const naverReservationUrl: string | null = null;
