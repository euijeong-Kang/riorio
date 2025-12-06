import { useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;

interface AvailabilityInfo {
  date: string;
  time: string;
  remainingTables: number;
  available: boolean;
  loading: boolean;
}

export default function CourseTimeModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 후 1초 뒤에 모달 표시
    const timer = setTimeout(() => {
      const hideUntil = localStorage.getItem('hideCourseTimeModalUntil');
      const now = new Date().getTime();
      
      if (!hideUntil || now > parseInt(hideUntil)) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 남은 좌석 정보 가져오기
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsLoading(true);
      const dates = ['2025-12-24', '2025-12-25'];
      const times = ['11:00', '12:30', '14:00', '17:00', '18:30', '20:00'];
      
      if (!SUPABASE_URL) {
        setIsLoading(false);
        return;
      }
      
      const availabilityPromises = dates.flatMap(date =>
        times.map(async (time) => {
          try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/check-availability`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ date, time }),
            });

            const data = await response.json();
            
            return {
              date,
              time,
              remainingTables: data.remainingTables ?? 0,
              available: data.available ?? false,
              loading: false,
            };
          } catch {
            return {
              date,
              time,
              remainingTables: 0,
              available: false,
              loading: false,
            };
          }
        })
      );

      const results = await Promise.all(availabilityPromises);
      setAvailability(results);
      setIsLoading(false);
    };

    if (isVisible) {
      fetchAvailability();
    }
  }, [isVisible]);

  // 특정 날짜/시간의 남은 좌석 정보 가져오기
  const getAvailability = (date: string, time: string): AvailabilityInfo | null => {
    return availability.find(a => a.date === date && a.time === time) || null;
  };

  // 좌석 상태 텍스트 가져오기
  const getSeatStatus = (info: AvailabilityInfo | null): { text: string; color: string; bgColor: string } => {
    if (!info || info.loading || isLoading) {
      return { text: '확인 중...', color: '#666666', bgColor: '#F5F5F5' };
    }
    
    if (!info.available || info.remainingTables === 0) {
      return { text: '마감', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    
    if (info.remainingTables <= 2) {
      return { text: '마감임박', color: '#EA580C', bgColor: '#FFEDD5' };
    }
    
    return { text: '여유 있음', color: '#059669', bgColor: '#D1FAE5' };
  };

  const handleClose = () => {
    if (dontShowToday) {
      // 오늘 자정까지의 타임스탬프 저장
      const tomorrow = new Date();
      tomorrow.setHours(23, 59, 59, 999);
      localStorage.setItem('hideCourseTimeModalUntil', tomorrow.getTime().toString());
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const lunchSchedule = [
    { session: '1부', time: '11:00', timeValue: '11:00' },
    { session: '2부', time: '12:30', timeValue: '12:30' },
    { session: '3부', time: '14:00', timeValue: '14:00' }
  ];

  const dinnerSchedule = [
    { session: '1부', time: '17:00', timeValue: '17:00' },
    { session: '2부', time: '18:30', timeValue: '18:30' },
    { session: '3부', time: '20:00', timeValue: '20:00' }
  ];

  const dates = [
    { label: '12/24 (수)', value: '2025-12-24' },
    { label: '12/25 (목)', value: '2025-12-25' }
  ];

  return (
    <>
      {/* PC Version - 컴팩트 가로 레이아웃 */}
      <div 
        className="hidden lg:flex fixed inset-0 z-50 items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={handleClose}
      >
        <div 
          className="relative w-full max-w-3xl rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 cursor-pointer"
            style={{ color: '#666666' }}
          >
            <i className="ri-close-line text-xl"></i>
          </button>

          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              오픈기념 코스 행사좌석 현황
            </h2>
            <p className="text-sm mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              🎄 크리스마스 연휴 실시간 예약 현황 🎄
            </p>
            <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#999999' }}>
              서비스 타임 80분 • 정리 타임 10분
            </p>
          </div>

          {/* Availability Grid - 두 날짜 가로 배치 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {dates.map((dateItem) => (
              <div key={dateItem.value} className="rounded-xl p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <h3 className="text-lg font-bold mb-3 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  {dateItem.label}
                </h3>
                
                {/* Lunch Schedule */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <i className="ri-sun-line text-sm" style={{ color: '#CBB676' }}></i>
                    <span className="text-sm font-semibold" style={{ color: '#0C2A23' }}>런치</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {lunchSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded-lg p-2 border text-center"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="text-xs font-semibold mb-1" style={{ color: '#0C2A23' }}>
                            {item.time}
                          </div>
                          <div 
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: status.bgColor, color: status.color }}
                          >
                            {status.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dinner Schedule */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <i className="ri-moon-line text-sm" style={{ color: '#0C2A23' }}></i>
                    <span className="text-sm font-semibold" style={{ color: '#0C2A23' }}>디너</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dinnerSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded-lg p-2 border text-center"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="text-xs font-semibold mb-1" style={{ color: '#0C2A23' }}>
                            {item.time}
                          </div>
                          <div 
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: status.bgColor, color: status.color }}
                          >
                            {status.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Info + Thanks Message */}
          <div className="text-center mb-3 space-y-1">
            <p className="text-[11px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              마감된 시간대는 <span style={{ color: '#CBB676', fontWeight: 600 }}>대기열 등록</span>이 가능합니다
            </p>
            <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#999999' }}>
              리오리오의 첫 걸음에 함께해주신 얼리서포터 여러분께 감사드립니다 🙏
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t" style={{ borderColor: '#E5E5E5' }}>
            {/* Don't Show Today Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  dontShowToday ? 'border-[#CBB676] bg-[#CBB676]' : 'border-gray-300 bg-white'
                }`}
              >
                {dontShowToday && (
                  <i className="ri-check-line text-xs" style={{ color: '#FFFFFF' }}></i>
                )}
              </div>
              <span className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                오늘 하루 보지 않기
              </span>
            </label>

            {/* Confirm Button */}
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Version - 컴팩트 세로 레이아웃 */}
      <div 
        className="flex lg:hidden fixed inset-0 z-50 items-center justify-center px-3"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={handleClose}
      >
        <div 
          className="relative w-full max-w-sm rounded-xl p-4 shadow-2xl"
          style={{ backgroundColor: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 cursor-pointer z-10"
            style={{ color: '#666666' }}
          >
            <i className="ri-close-line text-lg"></i>
          </button>

          {/* Header */}
          <div className="text-center mb-3 pr-6">
            <h2 className="text-base font-bold mb-0.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              오픈기념 코스 행사좌석 현황
            </h2>
            <p className="text-[11px] mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              🎄 크리스마스 연휴 실시간 예약 현황 🎄
            </p>
            <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#999999' }}>
              서비스 타임 80분 • 정리 타임 10분
            </p>
          </div>

          {/* Availability by Date */}
          <div className="space-y-2.5 mb-3">
            {dates.map((dateItem) => (
              <div key={dateItem.value} className="rounded-lg p-2.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <h3 className="text-sm font-bold mb-2 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  {dateItem.label}
                </h3>
                
                {/* Lunch & Dinner in compact grid */}
                <div className="space-y-2">
                  {/* Lunch */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <i className="ri-sun-line text-[10px]" style={{ color: '#CBB676' }}></i>
                      <span className="text-[10px] font-semibold" style={{ color: '#666' }}>런치</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {lunchSchedule.map((item) => {
                        const availInfo = getAvailability(dateItem.value, item.timeValue);
                        const status = getSeatStatus(availInfo);
                        return (
                          <div 
                            key={`${dateItem.value}-${item.timeValue}`}
                            className="rounded p-1.5 border text-center"
                            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                          >
                            <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#0C2A23' }}>
                              {item.time}
                            </div>
                            <div 
                              className="rounded px-1 py-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: status.bgColor, color: status.color }}
                            >
                              {status.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dinner */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <i className="ri-moon-line text-[10px]" style={{ color: '#0C2A23' }}></i>
                      <span className="text-[10px] font-semibold" style={{ color: '#666' }}>디너</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {dinnerSchedule.map((item) => {
                        const availInfo = getAvailability(dateItem.value, item.timeValue);
                        const status = getSeatStatus(availInfo);
                        return (
                          <div 
                            key={`${dateItem.value}-${item.timeValue}`}
                            className="rounded p-1.5 border text-center"
                            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                          >
                            <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#0C2A23' }}>
                              {item.time}
                            </div>
                            <div 
                              className="rounded px-1 py-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: status.bgColor, color: status.color }}
                            >
                              {status.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Info + Thanks Message */}
          <div className="text-center mb-2 space-y-0.5">
            <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              마감된 시간대는 <span style={{ color: '#CBB676', fontWeight: 600 }}>대기열 등록</span>이 가능합니다
            </p>
            <p className="text-[9px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#999999' }}>
              리오리오의 첫 걸음에 함께해주신 얼리서포터 여러분께 감사드립니다 🙏
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: '#E5E5E5' }}>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  dontShowToday ? 'border-[#CBB676] bg-[#CBB676]' : 'border-gray-300 bg-white'
                }`}
              >
                {dontShowToday && (
                  <i className="ri-check-line text-[8px]" style={{ color: '#FFFFFF' }}></i>
                )}
              </div>
              <span className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                오늘 하루 보지 않기
              </span>
            </label>

            <button
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
