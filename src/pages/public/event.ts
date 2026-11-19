export const christmas = {
  id: 'christmas-2026',
  year: 2026,
  status: 'draft',
  dates: null,
  startTimes: null,
  capacity: null,
  deposit: null,
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
} as const;

export const naverReservationUrl: string | null = null;
