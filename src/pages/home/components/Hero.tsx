import { useState, useEffect } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      
      // 버튼 활성화 시간: 2025년 12월 1일 오전 8시 (한국 시간)
      const buttonActiveDate = new Date('2025-12-01T08:00:00+09:00');
      const buttonActiveKoreaTime = new Date(buttonActiveDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      
      // 카운트다운 목표 시간: 2025년 12월 1일 오전 10시 30분 (한국 시간)
      const countdownTargetDate = new Date('2025-12-01T10:30:00+09:00');
      const countdownTargetKoreaTime = new Date(countdownTargetDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      
      // 버튼 활성화 여부 확인
      if (koreaTime >= buttonActiveKoreaTime) {
        setIsButtonActive(true);
      } else {
        setIsButtonActive(false);
      }
      
      // 카운트다운 계산
      const difference = countdownTargetKoreaTime.getTime() - koreaTime.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
        setShowCountdown(true);
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setShowCountdown(false);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = () => {
    if (isButtonActive) {
      // 버튼 활성화 시간이 되면 예약 페이지로 이동
      window.REACT_APP_NAVIGATE('/reserve');
    } else {
      // 버튼 활성화 전에는 팝업 표시
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const isCountdownActive = countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0;

  return (
    <>
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#0C2A23' }}
        data-section="hero"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C2A23] via-[#1a3d35] to-[#3B0D0C]" />
        
        {/* Spanish Tile Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23CBB676' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url("https://readdy.ai/api/search-image?query=Elegant%20Spanish%20restaurant%20interior%20with%20warm%20candlelight%2C%20wine%20glasses%20on%20wooden%20tables%2C%20intimate%20dining%20atmosphere%20with%20soft%20golden%20lighting%2C%20blurred%20background%20creating%20romantic%20ambiance%2C%20professional%20food%20photography%20style&width=1440&height=900&seq=hero-bg&orientation=landscape")`,
          }}
        />

        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight" style={{ fontFamily: 'Playfair Display, serif', color: '#FFFFFF' }}>
              RIORIO Grand Opening
              <span className="block mt-1 sm:mt-2" style={{ color: '#CBB676' }}>Special Offer</span>
            </h1>
            
            {/* Sub-headline */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 lg:mb-12 font-light leading-relaxed max-w-2xl mx-auto px-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.9)' }}>
              오픈 기념 한정 와인 페어링 스페셜 코스로<br />특별한 순간을 함께하세요
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4">
              {/* Main CTA Button - Enhanced Design */}
              <button 
                onClick={handleButtonClick}
                className="group relative inline-flex items-center justify-center px-10 sm:px-12 lg:px-16 py-4 sm:py-5 font-bold text-lg sm:text-xl lg:text-2xl rounded-2xl transition-all duration-500 hover:scale-110 whitespace-nowrap touch-manipulation cursor-pointer shadow-[0_0_40px_rgba(203,182,118,0.3)] hover:shadow-[0_0_60px_rgba(203,182,118,0.6)] animate-pulse-slow" 
                style={{ 
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', 
                  background: 'linear-gradient(135deg, #CBB676 0%, #E8D4A0 50%, #CBB676 100%)',
                  backgroundSize: '200% 200%',
                  color: '#0C2A23',
                  boxShadow: '0 10px 40px rgba(203, 182, 118, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <i className="ri-sparkling-line text-2xl animate-bounce"></i>
                  예약 오픈 & 예약하기
                  <i className="ri-arrow-right-line text-2xl group-hover:translate-x-2 transition-transform"></i>
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E8D4A0] via-[#CBB676] to-[#E8D4A0] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient" />
              </button>

              {/* My Reservation Link */}
              <button
                onClick={() => window.REACT_APP_NAVIGATE('/my-reservation')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer border-2 hover:bg-white/10"
                style={{
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  color: '#CBB676',
                  borderColor: '#CBB676'
                }}
              >
                <i className="ri-calendar-check-line text-lg"></i>
                <span className="text-sm font-semibold">나의 예약 확인하기</span>
                <i className="ri-arrow-right-s-line text-lg group-hover:translate-x-1 transition-transform"></i>
              </button>

              {/* Countdown Timer - 10시 30분까지만 표시 */}
              {showCountdown && isCountdownActive && (
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 rounded-xl" style={{ backgroundColor: 'rgba(203, 182, 118, 0.15)', border: '1px solid rgba(203, 182, 118, 0.3)' }}>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                    예약 오픈까지
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {countdown.days > 0 && (
                      <>
                        <div className="flex flex-col items-center">
                          <span className="text-lg sm:text-xl font-bold w-8 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                            {countdown.days}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>일</span>
                      </>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-lg sm:text-xl font-bold w-8 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                        {countdown.hours.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>시간</span>
                    <span className="text-sm sm:text-base font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.4)' }}>:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg sm:text-xl font-bold w-8 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                        {countdown.minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>분</span>
                    <span className="text-sm sm:text-base font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.4)' }}>:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-lg sm:text-xl font-bold w-8 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                        {countdown.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>초</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={closeModal}
        >
          <div 
            className="relative max-w-md w-full rounded-2xl p-8 shadow-2xl"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ color: '#666666', backgroundColor: 'transparent' }}
            >
              <i className="ri-close-line text-2xl"></i>
            </button>

            {/* Icon */}
            <div className="w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-6" style={{ backgroundColor: '#CBB676' }}>
              <i className="ri-calendar-line text-3xl" style={{ color: '#FFFFFF' }}></i>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              예약 기간 안내
            </h3>
            <p className="text-lg text-center mb-8" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              예약 곧 오픈됩니다.
            </p>

            {/* Button */}
            <button
              onClick={closeModal}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
