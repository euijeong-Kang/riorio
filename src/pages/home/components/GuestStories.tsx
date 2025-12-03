import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestStories() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const guestStories = [
    {
      id: 1,
      name: '김민지',
      headline: '스페인에서의 추억을 다시 한번',
      body: '바르셀로나에서 먹었던 빠에야의 그 맛을 잊을 수가 없어요.\n서울에서 진짜 스페인의 맛을 느낄 수 있다니, 벌써부터 기대됩니다.\n친구들과 함께 그때의 추억을 나누며 와인 한 잔 하고 싶어요.',
      date: '2025.01.15'
    },
    {
      id: 2,
      name: '박준호',
      headline: '아내와의 특별한 기념일을 위해',
      body: '결혼 10주년을 맞아 특별한 곳을 찾고 있었어요.\n리오리오의 분위기와 코스 메뉴가 완벽해 보입니다.\n아내가 좋아하는 와인과 함께 잊지 못할 저녁을 만들고 싶습니다.',
      date: '2025.01.18'
    },
    {
      id: 3,
      name: '이서연',
      headline: '가족과 함께하는 소중한 시간',
      body: '곧 성인이 될 아들과 조카에게 좋은 음식과 와인을 차분히 즐길 수 있는 좋은 음주문화, 식문화를 나누고 싶습니다.\n서두르지 않고 대화를 나누며, 음식 하나하나의 맛을 음미하는 시간.\n우리 가족들과의 행복한 추억을 함께 만들어가고 싶습니다.',
      date: '2025.01.20'
    }
  ];

  const stories = [
    {
      tag: '얼리서포터 01 · 김*영 님',
      headline: '스페인에서 시작된 우리의 이야기',
      body: '저희 부부는 각자 스페인 여행 중 처음 만나 지금은 결혼까지 하게 됐어요.\n그런 저희 동네에 스페인 음식을 제대로 즐길 수 있는 곳이 생긴다고 해서 자연스럽게 눈이 갔습니다.\n리오리오가 그때의 기억을 꺼내볼 수 있는, 편하게 찾아오는 단골 가게가 되었으면 해요.'
    },
    {
      tag: '얼리서포터 02 · ga*****님',
      headline: '이제는 동네에서 즐기고 싶어요',
      body: '저는 평일·주말 할 것 없이 매일 리오리오 앞을 지나는 사람입니다.\n강남이나 압구정까지 가지 않아도 집 근처에서 근사한 스페인 음식을 먹을 수 있겠구나, 하는 기대가 생겼어요.\n코스 메뉴만 봐도 이미 충분히 매력적이라, 오래 가는 동네 가게가 되길 응원하고 있습니다.'
    },
    {
      tag: '얼리서포터 03 · Wa****님',
      headline: '좋은 식사 문화를 함께',
      body: '곧 성인이 될 아들과 조카에게 좋은 음식과 와인을 차분히 즐길 수 있는 좋은 음주문화, 식문화를 나누고 싶습니다.\n서두르지 않고 대화를 나누며, 음식 하나하나의 맛을 음미하는 시간.\n리오리오에서 우리 가족들과의 행복한 추억을 함께 만들어가고 싶습니다.'
    }
  ];

  return (
    <section 
      id="guest-stories"
      ref={sectionRef} 
      className="relative py-16 sm:py-20 lg:py-24 overflow-hidden"
      style={{ backgroundColor: '#0C2A23' }}
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://readdy.ai/api/search-image?query=Elegant%20Spanish%20wine%20bar%20interior%20with%20warm%20ambient%20lighting%20featuring%20wooden%20tables%20wine%20bottles%20and%20soft%20bokeh%20background%20creating%20intimate%20dining%20atmosphere%20with%20dark%20green%20and%20burgundy%20tones%20blurred%20for%20subtle%20backdrop%20effect&width=1920&height=1080&seq=guest-stories-bg&orientation=landscape)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
        }}
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          backgroundColor: 'rgba(12, 42, 35, 0.85)',
          backdropFilter: 'blur(4px)'
        }} 
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
            많은 분들이 리오리오를
            <span className="block mt-2" style={{ color: '#CBB676' }}>기다려주시는 이유</span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.8)' }}>
            오픈 전부터 관심을 보내주신 분들의 진솔한<span className="block sm:inline"> </span>이야기를 들어보세요.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {stories.map((story, index) => (
            <div
              key={index}
              className={`group rounded-2xl p-6 sm:p-8 backdrop-blur-sm border transition-all duration-1000 hover:scale-105 hover:shadow-2xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(203, 182, 118, 0.2)',
                transitionDelay: `${400 + index * 150}ms`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Tag */}
              <div className="mb-4">
                <span 
                  className="inline-block px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap"
                  style={{ 
                    fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                    backgroundColor: 'rgba(203, 182, 118, 0.15)',
                    color: '#CBB676',
                    border: '1px solid rgba(203, 182, 118, 0.3)'
                  }}
                >
                  {story.tag}
                </span>
              </div>

              {/* Headline */}
              <h3 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 leading-tight"
                style={{ 
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  color: '#FFFFFF'
                }}
              >
                {story.headline}
              </h3>

              {/* Body */}
              <p 
                className="text-sm sm:text-base leading-relaxed whitespace-pre-line"
                style={{ 
                  fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                  color: 'rgba(255, 255, 255, 0.85)'
                }}
              >
                {story.body}
              </p>

              {/* Decorative Element */}
              <div 
                className="mt-6 pt-6 border-t"
                style={{ borderColor: 'rgba(203, 182, 118, 0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <i className="ri-heart-3-line text-lg" style={{ color: '#CBB676' }}></i>
                  <span 
                    className="text-xs font-medium"
                    style={{ 
                      fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    리오리오를 응원합니다
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className={`mt-12 sm:mt-16 text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => navigate('/your-story')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
            style={{
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              backgroundColor: '#CBB676',
              color: '#0C2A23',
              boxShadow: '0 4px 16px rgba(203, 182, 118, 0.4)'
            }}
          >
            <i className="ri-quill-pen-line text-xl"></i>
            여러분의 이야기를 들려주세요
          </button>
          
          <p 
            className="mt-6 text-xs sm:text-sm leading-relaxed"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: 'rgba(255, 255, 255, 0.5)'
            }}
          >
            *실제 문의 주신 분들의 이야기입니다. RIORIO를 같이 만들어갈 여러분들의 이야기도 궁금합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
