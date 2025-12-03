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
              remainingTables: data.remainingTables || 0,
              available: data.available || false,
              loading: false,
            };
          } catch (error) {
            console.error(`Error fetching availability for ${date} ${time}:`, error);
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
    if (!info || info.loading) {
      return { text: '확인 중...', color: '#666666', bgColor: '#F5F5F5' };
    }
    
    if (!info.available || info.remainingTables === 0) {
      return { text: '마감', color: '#DC2626', bgColor: '#FEE2E2' };
    }
    
    if (info.remainingTables === 1) {
      return { text: '마감임박', color: '#EA580C', bgColor: '#FFEDD5' };
    }
    
    return { text: `${info.remainingTables}자리 남음`, color: '#059669', bgColor: '#D1FAE5' };
  };

  const handleClose = () => {
    if (dontShowToday) {
      // 24시간 후의 타임스탬프 저장
      const tomorrow = new Date();
      tomorrow.setHours(23, 59, 59, 999);
      localStorage.setItem('hideCourseTimeModalUntil', tomorrow.getTime().toString());
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const lunchSchedule = [
    { session: '1부', time: '11:00 ~ 12:30', timeValue: '11:00' },
    { session: '2부', time: '12:30 ~ 14:00', timeValue: '12:30' },
    { session: '3부', time: '14:00 ~ 15:30', timeValue: '14:00' }
  ];

  const dinnerSchedule = [
    { session: '1부', time: '17:00 ~ 18:30', timeValue: '17:00' },
    { session: '2부', time: '18:30 ~ 20:00', timeValue: '18:30' },
    { session: '3부', time: '20:00 ~ 21:30', timeValue: '20:00' }
  ];

  const dates = [
    { label: '12월 24일 (수)', value: '2025-12-24' },
    { label: '12월 25일 (목)', value: '2025-12-25' }
  ];

  return (
    <>
      {/* PC Version - 가로 레이아웃 */}
      <div 
        className="hidden lg:flex fixed inset-0 z-50 items-center justify-center px-4 py-8 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={handleClose}
      >
        <div 
          className="relative w-full max-w-5xl rounded-2xl p-8 shadow-2xl my-8"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 cursor-pointer"
            style={{ color: '#666666' }}
          >
            <i className="ri-close-line text-2xl"></i>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              남은 좌석 안내
            </h2>
            <p className="text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              실시간 예약 현황을 확인하실 수 있습니다
            </p>
          </div>

          {/* Availability Grid - 날짜별 */}
          <div className="space-y-6 mb-6">
            {dates.map((dateItem) => (
              <div key={dateItem.value} className="rounded-xl p-6 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  {dateItem.label}
                </h3>
                
                {/* Lunch Schedule */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#FFF4E6' }}>
                      <i className="ri-sun-line text-sm" style={{ color: '#CBB676' }}></i>
                    </div>
                    <h4 className="text-lg font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      런치 타임
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {lunchSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded-lg p-3 border"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                              {item.session}
                            </span>
                            <span className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                              {item.time}
                            </span>
                          </div>
                          <div 
                            className="rounded px-2 py-1 text-xs font-semibold text-center"
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
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#F0F4FF' }}>
                      <i className="ri-moon-line text-sm" style={{ color: '#0C2A23' }}></i>
                    </div>
                    <h4 className="text-lg font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      디너 타임
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {dinnerSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded-lg p-3 border"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                              {item.session}
                            </span>
                            <span className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                              {item.time}
                            </span>
                          </div>
                          <div 
                            className="rounded px-2 py-1 text-xs font-semibold text-center"
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

          {/* Notice */}
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#FFF4E6' }}>
            <div className="flex gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-information-line text-lg" style={{ color: '#CBB676' }}></i>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                좌석 현황은 실시간으로 업데이트됩니다.<br />
                마감임박 또는 마감 상태는 빠르게 변경될 수 있으니 예약을 서둘러주세요.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4">
            {/* Don't Show Today Checkbox */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={dontShowToday}
                    onChange={(e) => setDontShowToday(e.target.checked)}
                    className="sr-only"
                  />
                  <div 
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      dontShowToday ? 'border-[#CBB676] bg-[#CBB676]' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {dontShowToday && (
                      <i className="ri-check-line text-sm" style={{ color: '#FFFFFF' }}></i>
                    )}
                  </div>
                </div>
                <span className="text-sm select-none" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                  오늘 하루 보지 않기
                </span>
              </label>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleClose}
              className="px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Version - 콤팩트 세로 레이아웃 */}
      <div 
        className="flex lg:hidden fixed inset-0 z-50 items-center justify-center px-3 py-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={handleClose}
      >
        <div 
          className="relative w-full max-w-sm rounded-xl p-4 shadow-2xl"
          style={{ backgroundColor: '#FFFFFF', maxHeight: '95vh', overflowY: 'auto' }}
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
            <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              남은 좌석 안내
            </h2>
            <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              실시간 예약 현황
            </p>
          </div>

          {/* Availability by Date */}
          <div className="space-y-3 mb-3">
            {dates.map((dateItem) => (
              <div key={dateItem.value} className="rounded-lg p-3 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <h3 className="text-sm font-bold mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  {dateItem.label}
                </h3>
                
                {/* Lunch Schedule */}
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <div className="w-4 h-4 flex items-center justify-center rounded" style={{ backgroundColor: '#FFF4E6' }}>
                      <i className="ri-sun-line text-[10px]" style={{ color: '#CBB676' }}></i>
                    </div>
                    <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      런치
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {lunchSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded p-1.5 border"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="text-center mb-1">
                            <span className="font-bold text-[10px] block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                              {item.session}
                            </span>
                            <span className="font-semibold text-[9px] block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                              {item.time.split(' ~ ')[0]}
                            </span>
                          </div>
                          <div 
                            className="rounded px-1 py-0.5 text-[9px] font-semibold text-center"
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
                  <div className="flex items-center gap-1 mb-1.5">
                    <div className="w-4 h-4 flex items-center justify-center rounded" style={{ backgroundColor: '#F0F4FF' }}>
                      <i className="ri-moon-line text-[10px]" style={{ color: '#0C2A23' }}></i>
                    </div>
                    <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      디너
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {dinnerSchedule.map((item) => {
                      const availInfo = getAvailability(dateItem.value, item.timeValue);
                      const status = getSeatStatus(availInfo);
                      return (
                        <div 
                          key={`${dateItem.value}-${item.timeValue}`}
                          className="rounded p-1.5 border"
                          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E5E5' }}
                        >
                          <div className="text-center mb-1">
                            <span className="font-bold text-[10px] block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                              {item.session}
                            </span>
                            <span className="font-semibold text-[9px] block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                              {item.time.split(' ~ ')[0]}
                            </span>
                          </div>
                          <div 
                            className="rounded px-1 py-0.5 text-[9px] font-semibold text-center"
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

          {/* Notice */}
          <div className="rounded-lg p-2 mb-3" style={{ backgroundColor: '#FFF4E6' }}>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-information-line text-xs" style={{ color: '#CBB676' }}></i>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                좌석 현황은 실시간으로 업데이트됩니다. 마감임박 시 빠르게 예약해주세요.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-2">
            {/* Don't Show Today Checkbox */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
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
                      <i className="ri-check-line text-[10px]" style={{ color: '#FFFFFF' }}></i>
                    )}
                  </div>
                </div>
                <span className="text-xs select-none" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                  오늘 하루 보지 않기
                </span>
              </label>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
