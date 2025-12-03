import { useState, useEffect } from 'react';

export default function CourseTimeModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

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
    { session: '1부', time: '11:00 ~ 12:30', service: '서비스 타임 80분', cleanup: '정리 타임 10분' },
    { session: '2부', time: '12:30 ~ 14:00', service: '서비스 타임 80분', cleanup: '정리 타임 10분' },
    { session: '3부', time: '14:00 ~ 15:30', service: '서비스 타임 80분', cleanup: '' }
  ];

  const dinnerSchedule = [
    { session: '1부', time: '17:00 ~ 18:30', service: '서비스 타임 80분', cleanup: '정리 타임 10분' },
    { session: '2부', time: '18:30 ~ 20:00', service: '서비스 타임 80분', cleanup: '정리 타임 10분' },
    { session: '3부', time: '20:00 ~ 21:30', service: '서비스 타임 80분', cleanup: '' }
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
              오픈행사 코스 운영시간 안내
            </h2>
            <p className="text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              원활한 서비스를 위해 시간대별 5테이블 운영됩니다
            </p>
          </div>

          {/* Schedule Grid - 가로 배치 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Lunch Schedule */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#FFF4E6' }}>
                  <i className="ri-sun-line text-lg" style={{ color: '#CBB676' }}></i>
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  런치 타임
                </h3>
              </div>
              <div className="space-y-3">
                {lunchSchedule.map((item, index) => (
                  <div 
                    key={index}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                            {item.session}
                          </span>
                          <span className="font-semibold text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {item.time}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                          <span>{item.service}</span>
                          {item.cleanup && (
                            <>
                              <span>•</span>
                              <span>{item.cleanup}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dinner Schedule */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#F0F4FF' }}>
                  <i className="ri-moon-line text-lg" style={{ color: '#0C2A23' }}></i>
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  디너 타임
                </h3>
              </div>
              <div className="space-y-3">
                {dinnerSchedule.map((item, index) => (
                  <div 
                    key={index}
                    className="rounded-xl p-4 border"
                    style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                            {item.session}
                          </span>
                          <span className="font-semibold text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {item.time}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                          <span>{item.service}</span>
                          {item.cleanup && (
                            <>
                              <span>•</span>
                              <span>{item.cleanup}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#FFF4E6' }}>
            <div className="flex gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-information-line text-lg" style={{ color: '#CBB676' }}></i>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                예약하신 시간에 맞춰 입장해 주시기 바랍니다.<br />
                원활한 서비스 제공을 위해 시간 엄수 부탁드립니다.
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
              오픈행사 코스 운영시간 안내
            </h2>
            <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              시간대별 5테이블 운영
            </p>
          </div>

          {/* Lunch Schedule */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#FFF4E6' }}>
                <i className="ri-sun-line text-xs" style={{ color: '#CBB676' }}></i>
              </div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                런치 타임
              </h3>
            </div>
            <div className="space-y-1.5">
              {lunchSchedule.map((item, index) => (
                <div 
                  key={index}
                  className="rounded-lg p-2 border"
                  style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                      {item.session}
                    </span>
                    <span className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      {item.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                    <span>{item.service}</span>
                    {item.cleanup && (
                      <>
                        <span>•</span>
                        <span>{item.cleanup}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dinner Schedule */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#F0F4FF' }}>
                <i className="ri-moon-line text-xs" style={{ color: '#0C2A23' }}></i>
              </div>
              <h3 className="text-sm font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                디너 타임
              </h3>
            </div>
            <div className="space-y-1.5">
              {dinnerSchedule.map((item, index) => (
                <div 
                  key={index}
                  className="rounded-lg p-2 border"
                  style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                      {item.session}
                    </span>
                    <span className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      {item.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                    <span>{item.service}</span>
                    {item.cleanup && (
                      <>
                        <span>•</span>
                        <span>{item.cleanup}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notice */}
          <div className="rounded-lg p-2 mb-3" style={{ backgroundColor: '#FFF4E6' }}>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-information-line text-xs" style={{ color: '#CBB676' }}></i>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                예약 시간에 맞춰 입장해 주시기 바랍니다. 시간 엄수 부탁드립니다.
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
