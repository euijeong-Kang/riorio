export type EventStatus = 'draft' | 'announced' | 'booking_open' | 'sold_out' | 'closed' | 'ended';
export type EventConfig = {
  id: string;
  year: number;
  bookingOpeningDate: string;
  status: EventStatus;
  dates: readonly string[] | null;
  startTimes: readonly string[] | null;
  capacity: number | null;
  deposit: number | null;
  depositPerGuest: number;
  reservationTerms: string | null;
  priceApproved: boolean;
  coursePrice: number;
  pairingPrice: number;
  durationMinutes: number;
  minimumGuests: number;
  courses: readonly (readonly [string, string, string, string, string, string])[];
};

export const christmas = {
  id: 'christmas-2026',
  year: 2026,
  bookingOpeningDate: '2026-11-24',
  status: 'draft',
  dates: ['2026-12-24', '2026-12-25'],
  startTimes: ['11:00', '13:00', '17:30', '19:30'],
  capacity: null,
  deposit: null,
  depositPerGuest: 30000,
  reservationTerms: null,
  priceApproved: true,
  coursePrice: 120000,
  pairingPrice: 40000,
  durationMinutes: 100,
  minimumGuests: 2,
  courses: [
    ['아뮤즈', '크로케타스', 'Amuse', 'Croquetas', '식탁의 시작을 여는 스페인식 크로케타스', 'Spanish croquetas to begin the meal'],
    ['콜드 애피타이저', '하몽 뽈뽀 세비체', 'Cold appetizer', 'Jamón and octopus ceviche', '하몽과 뽈뽀로 준비하는 차가운 세비체', 'A chilled ceviche with jamón and octopus'],
    ['핫 애피타이저', '파타타스 브라바스', 'Hot appetizer', 'Patatas bravas', '스페인식 감자 요리를 파인 다이닝으로 재해석한 한 접시', 'Spanish-style potatoes reimagined for fine dining'],
    ['수프', '머쉬룸 콘소메', 'Soup', 'Mushroom consommé', '다양한 버섯의 향을 가득 담고 생 블랙 트러플을 올린 맑은 수프', 'A clear soup infused with mushrooms and topped with fresh black truffle'],
    ['생선', '꿀대구', 'Fish', 'Honey cod', '스페인식 삐스또 위에 대구와 꿀, 아이올리를 더해 직화의 풍미를 입힌 리오리오의 꿀대구', 'RIORIO’s flame-finished cod with honey and aioli, served over Spanish pisto'],
    ['메인', '이베리코', 'Main', 'Ibérico pork', '세계 4대 진미 중 하나로도 불리는 스페인 이베리코 베요타 100%로 준비한 스테이크', 'Steak made with 100% Ibérico Bellota pork from Spain, sometimes celebrated as a fourth great delicacy'],
    ['라이스', '아로스 콘 마리스코스', 'Rice', 'Arroz con mariscos', '4시간 동안 우려낸 해산물 육수에 깊은 감칠맛과 바다의 향을 담은 밥 요리', 'Seafood rice with rich savoury depth, made with seafood stock simmered for four hours'],
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
