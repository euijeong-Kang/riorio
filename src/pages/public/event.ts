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
  bookingOpeningDate: '2026-11-24',
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
    ['아뮤즈', '크로케타스', 'Amuse', 'Croquetas', '식탁의 시작을 여는 스페인식 크로케타스', 'Spanish croquetas to begin the meal'],
    ['콜드 애피타이저', '하몽 뽈뽀 세비체', 'Cold appetizer', 'Jamón and octopus ceviche', '하몽과 뽈뽀로 준비하는 차가운 세비체', 'A chilled ceviche with jamón and octopus'],
    ['핫 애피타이저', '파타타스 브라바스', 'Hot appetizer', 'Patatas bravas', '스페인식 감자 요리 파타타스 브라바스', 'The Spanish potato dish, patatas bravas'],
    ['수프', '콘소메', 'Soup', 'Consommé', '비프 또는 버섯 콘소메로 준비 예정', 'Beef or mushroom consommé, to be confirmed'],
    ['생선', '꿀대구', 'Fish', 'Honey cod', '꿀과 대구가 어우러지는 생선 요리', 'A fish course of cod and honey'],
    ['메인', '이베리코', 'Main', 'Ibérico pork', '이베리코를 선보이는 메인 요리', 'An Ibérico pork main course'],
    ['라이스', '아로스 데 마리스코스', 'Rice', 'Arroz de mariscos', '스페인식 해산물 밥', 'Spanish-style seafood rice'],
    ['디저트', '바스크 치즈케이크·그라니사도', 'Dessert', 'Basque cheesecake and granizado', '바스크 치즈케이크와 그라니사도로 마무리', 'Basque cheesecake and granizado to finish'],
  ],
} as const satisfies EventConfig;

export const totalPrice = (event: EventConfig) => event.coursePrice + event.pairingPrice;
export const canAcceptReservations = (event: EventConfig) =>
  event.status === 'booking_open' && event.priceApproved &&
  !!event.dates?.length && !!event.startTimes?.length &&
  event.capacity !== null && event.capacity > 0 && event.deposit !== null &&
  !!event.reservationTerms?.trim();

export const naverReservationUrl = 'https://m.place.naver.com/restaurant/2066851037';
