
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGTMTracking } from '../../hooks/useGTMTracking';

export default function YourStory() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    story: ''
  });
  const { trackFormStart, trackFormSubmit, trackShareClick } = useGTMTracking();

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.contact.trim() || !formData.story.trim()) {
      setSubmitStatus('error');
      return;
    }

    if (formData.story.length > 500) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/add-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            contact: formData.contact.trim(),
            story: formData.story.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', contact: '', story: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('사연 전송 오류:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getShareUrl = () => {
    const origin = window.location.origin;
    // 홈페이지의 스토리 섹션으로 바로 이동 (#guest-stories 앵커)
    return `${origin}/#guest-stories`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🍷 RIORIO 그랜드 오픈 | 한정 와인 페어링 스페셜',
          text: '✨ 전복 빠에야부터 이베리코 스테이크까지, 스페인의 정취를 담은 특별한 코스를 경험하세요',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleKakaoShare = () => {
    const url = getShareUrl();
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=YOUR_APP_KEY&validation_action=default&validation_params={"link_url":"${encodeURIComponent(url)}"}`;
    window.open(kakaoUrl, '_blank');
    trackShareClick('kakaotalk');
    setShowShareMenu(false);
  };

  const handleInstagramShare = () => {
    const url = getShareUrl();
    const text = encodeURIComponent('🍷 RIORIO 그랜드 오픈 | 한정 와인 페어링 스페셜\n\n✨ 전복 빠에야부터 이베리코 스테이크까지, 스페인의 정취를 담은 특별한 코스를 경험하세요');
    window.open(`https://www.instagram.com/direct/new/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
    trackShareClick('instagram');
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      trackShareClick('copy_link');
      setShowShareMenu(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C2A23]">
      {/* Back Button */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap cursor-pointer"
          style={{
            fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            border: '1px solid rgba(203, 182, 118, 0.2)'
          }}
        >
          <i className="ri-arrow-left-line"></i>
          홈으로 돌아가기
        </button>
      </div>

      <section 
        ref={sectionRef}
        className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
        data-section="story_form"
      >
        {/* Background with gradient overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://readdy.ai/api/search-image?query=Elegant%20Spanish%20tapas%20restaurant%20interior%20with%20warm%20candlelight%20wine%20glasses%20on%20wooden%20table%20creating%20intimate%20cozy%20atmosphere%20with%20dark%20green%20burgundy%20gold%20tones%20soft%20focus%20background%20for%20sophisticated%20dining%20experience&width=1920&height=1080&seq=story-form-bg&orientation=landscape)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(6px)',
          }}
        />
        <div 
          className="absolute inset-0 z-0" 
          style={{ 
            background: 'linear-gradient(to bottom, rgba(12, 42, 35, 0.92), rgba(12, 42, 35, 0.95))',
          }} 
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Header */}
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(203, 182, 118, 0.1)', border: '1px solid rgba(203, 182, 118, 0.3)' }}>
                <i className="ri-quill-pen-line text-lg" style={{ color: '#CBB676' }}></i>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                  Your Story
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                여러분의 이야기를
                <span className="block mt-2" style={{ color: '#CBB676' }}>들려주세요</span>
              </h2>
              
              <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.75)' }}>
                리오리오에 대한 기대, 스페인 음식과의 추억,<span className="block sm:inline"> </span>함께하고 싶은 사람들의 이야기.<br />
                여러분의 진솔한 이야기가<br className="block sm:hidden" />
                <span className="hidden sm:inline"> </span>
                리오리오를 더 특별하게 만듭니다.
              </p>
            </div>

            {/* Form */}
            <form 
              id="riorio-story-form"
              data-readdy-form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-sm border"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(203, 182, 118, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Name Input */}
              <div className="mb-6">
                <label 
                  htmlFor="name" 
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}
                >
                  성함 <span style={{ color: '#CBB676' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="성함, 별명, 닉네임 등 자유롭게 기재해주세요"
                  className="w-full px-4 py-3 rounded-lg text-sm sm:text-base transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(203, 182, 118, 0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#CBB676'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(203, 182, 118, 0.2)'}
                />
              </div>

              {/* Contact Input */}
              <div className="mb-6">
                <label 
                  htmlFor="contact" 
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}
                >
                  연락처 <span style={{ color: '#CBB676' }}>*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  placeholder="이메일, 전화번호, 인스타 계정 등 자유롭게 기재해주세요"
                  className="w-full px-4 py-3 rounded-lg text-sm sm:text-base transition-all duration-300 focus:outline-none focus:ring-2"
                  style={{
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(203, 182, 118, 0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#CBB676'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(203, 182, 118, 0.2)'}
                />
              </div>

              {/* Story Textarea */}
              <div className="mb-6">
                <label 
                  htmlFor="story" 
                  className="block text-sm font-semibold mb-2"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}
                >
                  사연 <span style={{ color: '#CBB676' }}>*</span>
                </label>
                <textarea
                  id="story"
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  rows={6}
                  placeholder="리오리오에 대한 기대, 스페인 음식과의 추억, 함께 방문하고 싶은 분들의 이야기 등 자유롭게 들려주세요."
                  className="w-full px-4 py-3 rounded-lg text-sm sm:text-base transition-all duration-300 focus:outline-none focus:ring-2 resize-none"
                  style={{
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(203, 182, 118, 0.2)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#CBB676'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(203, 182, 118, 0.2)'}
                />
                <div className="mt-1 text-right">
                  <span 
                    className="text-[10px] sm:text-xs"
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: formData.story.length > 500 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {formData.story.length} / 500자
                  </span>
                </div>
              </div>

              {/* Submit and Share Buttons */}
              <div className="flex flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-lg font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  style={{
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                    backgroundColor: '#CBB676',
                    color: '#0C2A23',
                    boxShadow: '0 4px 16px rgba(203, 182, 118, 0.3)'
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      전송 중...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ri-send-plane-fill"></i>
                      사연 보내기
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 py-4 px-3 sm:px-6 rounded-lg font-bold text-xs sm:text-base lg:text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(203, 182, 118, 0.15)',
                    color: '#CBB676',
                    border: '2px solid #CBB676',
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif'
                  }}
                >
                  <span className="flex items-center justify-center gap-1 sm:gap-2">
                    <i className="ri-share-line text-base sm:text-xl"></i>
                    <span>우리 이거 써보자! 🍷</span>
                  </span>
                </button>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div 
                  className="mt-4 p-4 rounded-lg flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.3)' }}
                >
                  <i className="ri-checkbox-circle-fill text-xl" style={{ color: '#4CAF50' }}></i>
                  <p className="text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                    소중한 이야기 감사합니다. 리오리오가 여러분의 기대에 부응하는 공간이 되겠습니다.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div 
                  className="mt-4 p-4 rounded-lg flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(244, 67, 54, 0.15)', border: '1px solid rgba(244, 67, 54, 0.3)' }}
                >
                  <i className="ri-error-warning-fill text-xl" style={{ color: '#F44336' }}></i>
                  <p className="text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                    전송에 실패했습니다. 모든 항목을 확인하고 다시 시도해주세요.
                  </p>
                </div>
              )}
            </form>

            {/* Privacy Note */}
            <div className="mt-6 text-center">
              <p 
                className="text-xs leading-relaxed"
                style={{ 
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <i className="ri-lock-line mr-1"></i>
                보내주신 사연은 리오리오를 더 특별하게 만드는 데 소중히 활용됩니다. 개인정보는 따로 보관하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 공유 메뉴 모달 */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(12, 42, 35, 0.6)' }}
          onClick={() => setShowShareMenu(false)}
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
                onClick={() => setShowShareMenu(false)}
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
    </div>
  );
}
