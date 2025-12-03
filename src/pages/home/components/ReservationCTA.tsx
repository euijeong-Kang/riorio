import { useState, useEffect, useRef } from 'react';
import { useGTMTracking } from '../../../hooks/useGTMTracking';

export default function ReservationCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { trackReservationClick, trackPhoneClick, trackMapClick } = useGTMTracking();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleInstagramClick = () => {
    trackReservationClick('cta_section', '준비과정 보기');
    window.open('https://www.instagram.com/riorio_oficial/', '_blank');
  };

  const handleReservationClick = () => {
    trackReservationClick('cta_section', '예약하기');
    window.REACT_APP_NAVIGATE('/reserve');
  };

  const handlePhoneClick = () => {
    trackPhoneClick('02-6952-1026', 'cta_section');
  };

  const handleMapClick = () => {
    trackMapClick('naver');
  };

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 lg:py-24 xl:py-32 overflow-hidden" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#0C2A23', color: '#CBB676' }}>
              1.5시간 코스
            </span>
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#3B0D0C', color: '#CBB676' }}>
              한정 좌석
            </span>
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#0C2A23' }}>
              셰프 특선
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
            특별한 순간을 위한
            <span className="block" style={{ color: '#CBB676' }}>매력적인 선택</span>
          </h2>

          {/* Description */}
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10 lg:mb-12">
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed mb-4 sm:mb-6" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(12, 42, 35, 0.8)' }}>
              <span className="block sm:hidden">
                오픈 스페셜 코스는 좌석이 한정되어 있습니다. <br />
                정성스럽게 페어링된 와인과 함께 <br />
                스페인의 미식 여행을 경험해보세요.
              </span>
              <span className="hidden sm:block">
                오픈 스페셜 코스는 좌석이 한정되어 있습니다. <br />
                정성스럽게 페어링된 와인과 함께 스페인의 미식 여행을 경험해보세요.
              </span>
            </p>

            {/* Event Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10">
              <div className="rounded-xl p-4 sm:p-6 shadow-lg border" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(12, 42, 35, 0.1)' }}>
                <h3 className="font-semibold text-sm sm:text-base mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  행사일
                </h3>
                <p className="font-bold text-lg sm:text-xl" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                  12월 24일 – 25일
                </p>
              </div>

              <div className="rounded-xl p-4 sm:p-6 shadow-lg border" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(12, 42, 35, 0.1)' }}>
                <h3 className="font-semibold text-sm sm:text-base mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  예약기간
                </h3>
                <p className="font-bold text-lg sm:text-xl" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                  12월 01일 – 12월 23일
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-[#0C2A23] to-[#3B0D0C] rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10" style={{ color: '#FFFFFF' }}>
              <div className="text-center">
                <p className="text-sm sm:text-base font-medium mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                  와인 페어링 포함
                </p>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2" style={{ fontFamily: 'Allura, cursive' }}>
                  66,000 <span className="text-xl sm:text-2xl lg:text-3xl font-normal" style={{ fontFamily: 'Allura, cursive' }}>1 per</span>
                </div>
                <p className="text-sm sm:text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.7)' }}>
                  시간대별 5테이블 한정 운영
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4">
            {/* Main CTA Button - Instagram Link */}
            <button 
              onClick={handleInstagramClick}
              className="group relative inline-flex items-center justify-center px-10 sm:px-12 lg:px-14 py-4 sm:py-5 font-bold text-lg sm:text-xl rounded-2xl transition-all duration-500 hover:scale-110 whitespace-nowrap touch-manipulation cursor-pointer shadow-[0_0_40px_rgba(203,182,118,0.3)] hover:shadow-[0_0_60px_rgba(203,182,118,0.6)]" 
              style={{ 
                fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', 
                background: 'linear-gradient(135deg, #CBB676 0%, #E8D4A0 50%, #CBB676 100%)',
                backgroundSize: '200% 200%',
                color: '#0C2A23',
                boxShadow: '0 10px 40px rgba(203, 182, 118, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <span className="relative z-10 flex items-center gap-3">
                <i className="ri-sparkling-line text-xl"></i>
                준비과정 보기
                <i className="ri-instagram-line text-xl"></i>
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E8D4A0] via-[#CBB676] to-[#E8D4A0] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>

            {/* Secondary Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* My Reservation Link */}
              <button
                onClick={() => window.REACT_APP_NAVIGATE('/my-reservation')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer border-2 hover:bg-gray-50"
                style={{
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  color: '#0C2A23',
                  borderColor: '#CBB676'
                }}
              >
                <i className="ri-calendar-check-line text-lg" style={{ color: '#CBB676' }}></i>
                <span className="text-sm font-semibold">나의 예약 확인하기</span>
                <i className="ri-arrow-right-s-line text-lg group-hover:translate-x-1 transition-transform" style={{ color: '#CBB676' }}></i>
              </button>

              {/* Reservation Button */}
              <button
                onClick={handleReservationClick}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer border-2"
                style={{
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  backgroundColor: '#CBB676',
                  color: '#FFFFFF',
                  borderColor: '#CBB676'
                }}
              >
                <i className="ri-calendar-line text-lg"></i>
                <span className="text-sm font-semibold">예약하기</span>
                <i className="ri-arrow-right-s-line text-lg group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <p className="mt-6 sm:mt-8 text-xs sm:text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(12, 42, 35, 0.6)' }}>
            예약 확정 후 변경 및 취소는 5일 전까지 가능합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
