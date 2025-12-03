import { useState, useEffect } from 'react';
import { useGTMTracking } from '../../hooks/useGTMTracking';

export default function ShareButton() {
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { trackShareClick } = useGTMTracking();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // ReservationCTA 섹션에 도달했는지 확인 (페이지의 약 70% 지점)
      const reservationCTAThreshold = documentHeight * 0.7;
      
      if (scrollPosition > reservationCTAThreshold && !showButton) {
        // 애니메이션 완료 후 사용자가 읽을 시간을 고려하여 2초 딜레이
        setTimeout(() => {
          setShowButton(true);
        }, 2000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showButton]);

  // 공유용 기본 URL (도메인만)
  const getShareUrl = () => {
    const origin = window.location.origin;
    // 홈페이지의 스토리 섹션으로 바로 이동
    return `${origin}/#guest-stories`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    
    // 네이티브 공유 기능 지원 여부 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🍷 RIORIO 그랜드 오픈 | 한정 와인 페어링 스페셜',
          text: '✨ 전복 빠에야부터 이베리코 스테이크까지, 스페인의 정취를 담은 특별한 코스를 경험하세요',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowMenu(true);
        }
      }
    } else {
      setShowMenu(true);
    }
  };

  const handleKakaoShare = () => {
    const url = getShareUrl();
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=YOUR_APP_KEY&validation_action=default&validation_params={"link_url":"${encodeURIComponent(url)}"}`;
    window.open(kakaoUrl, '_blank');
    trackShareClick('kakaotalk');
    setShowMenu(false);
  };

  const handleInstagramShare = () => {
    const url = getShareUrl();
    const text = encodeURIComponent('🍷 RIORIO 그랜드 오픈 | 한정 와인 페어링 스페셜\n\n✨ 전복 빠에야부터 이베리코 스테이크까지, 스페인의 정취를 담은 특별한 코스를 경험하세요');
    window.open(`https://www.instagram.com/direct/new/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    trackShareClick('instagram');
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      trackShareClick('copy_link');
      setShowMenu(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* 플로팅 공유 버튼 */}
      <button
        onClick={handleShare}
        className={`fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-xl cursor-pointer z-40 ${
          showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ backgroundColor: '#CBB676' }}
        aria-label="공유하기"
      >
        <i className="ri-share-line text-2xl" style={{ color: '#FFFFFF' }}></i>
      </button>

      {/* 공유 메뉴 모달 */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(12, 42, 35, 0.6)' }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-full sm:w-auto sm:min-w-[400px] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <h3 
                className="text-xl font-bold" 
                style={{ 
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', 
                  color: '#0C2A23' 
                }}
              >
                공유하기
              </h3>
              <button
                onClick={() => setShowMenu(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-100 cursor-pointer"
              >
                <i className="ri-close-line text-2xl" style={{ color: '#666666' }}></i>
              </button>
            </div>

            {/* 공유 옵션 */}
            <div className="space-y-3">
              {/* 카카오톡 */}
              <button
                onClick={handleKakaoShare}
                className="w-full flex items-center p-4 rounded-2xl transition-all duration-200 cursor-pointer group"
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full mr-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: '#FEE500' }}
                >
                  <i className="ri-kakao-talk-fill text-2xl" style={{ color: '#3C1E1E' }}></i>
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="font-semibold text-base" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#0C2A23'
                    }}
                  >
                    카카오톡
                  </p>
                  <p 
                    className="text-sm mt-0.5" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#999999'
                    }}
                  >
                    친구에게 공유하기
                  </p>
                </div>
                <i className="ri-arrow-right-s-line text-xl" style={{ color: '#CCCCCC' }}></i>
              </button>

              {/* 인스타그램 */}
              <button
                onClick={handleInstagramShare}
                className="w-full flex items-center p-4 rounded-2xl transition-all duration-200 cursor-pointer group"
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full mr-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ 
                    background: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)'
                  }}
                >
                  <i className="ri-instagram-line text-2xl" style={{ color: '#FFFFFF' }}></i>
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="font-semibold text-base" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#0C2A23'
                    }}
                  >
                    인스타그램
                  </p>
                  <p 
                    className="text-sm mt-0.5" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#999999'
                    }}
                  >
                    DM으로 공유하기
                  </p>
                </div>
                <i className="ri-arrow-right-s-line text-xl" style={{ color: '#CCCCCC' }}></i>
              </button>

              {/* 링크 복사 */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center p-4 rounded-2xl transition-all duration-200 cursor-pointer group"
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-full mr-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: '#CBB676' }}
                >
                  <i className="ri-link text-2xl" style={{ color: '#FFFFFF' }}></i>
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="font-semibold text-base" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#0C2A23'
                    }}
                  >
                    링크 복사
                  </p>
                  <p 
                    className="text-sm mt-0.5" 
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: '#999999'
                    }}
                  >
                    URL을 클립보드에 복사
                  </p>
                </div>
                <i className="ri-arrow-right-s-line text-xl" style={{ color: '#CCCCCC' }}></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <div 
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in"
          style={{ backgroundColor: '#0C2A23' }}
        >
          <p 
            className="text-sm font-medium whitespace-nowrap" 
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: '#FFFFFF'
            }}
          >
            링크가 복사되었습니다
          </p>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
