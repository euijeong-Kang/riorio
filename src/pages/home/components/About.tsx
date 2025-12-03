import { useState, useEffect, useRef } from 'react';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section 
      ref={sectionRef} 
      className="py-16 sm:py-20 lg:py-32 overflow-hidden" 
      style={{ backgroundColor: '#FAFAFA' }}
      data-section="about"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Text Content */}
          <div className={`mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              일상에 스며든
              <span className="block" style={{ color: '#CBB676' }}>스페인의 한 끼</span>
            </h2>
            
            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(12, 42, 35, 0.8)' }}>
              <p>
                리오리오는 스파클링 웰컴 와인으로 시작해<br />
                풍미 가득한 타파스와 전복 빠에야, 이베리코 스테이크와 디저트까지 스페인의 맛과 향을 정성스럽게 담아낸 코스를 선보입니다. 각 코스는 엄선된 와인과의 페어링을 통해 한층 깊고 조화로운 식사 경험을 완성합니다.
              </p>
              <p>
                이번 오픈 스페셜 코스는 스페인의 따뜻한 정취와 진심이 담긴 요리 정신을 바탕으로, 전통적인 방식에 현대적인 감각을 더한 리오리오만의 스페인 다이닝으로 준비했습니다.
              </p>
              <p>
                리오리오의 셰프팀은 스페인 요리의 매력을 깊이 연구하며 그 풍미와 감성을 리오리오만의 방식으로 풀어냈습니다. 국내 제철 재료와 감각적인 조리법을 더해 한국에서도 스페인의 여유와 따뜻함을 느낄 수 있는 특별한 저녁을 완성했습니다.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://readdy.ai/api/search-image?query=Elegant%20Spanish%20restaurant%20dining%20scene%20with%20beautifully%20plated%20tapas%20dishes%2C%20wine%20glasses%20filled%20with%20red%20wine%2C%20warm%20ambient%20lighting%2C%20wooden%20table%20setting%2C%20professional%20food%20photography%2C%20intimate%20atmosphere%20with%20candles%20and%20Spanish%20ceramic%20plates&width=600&height=700&seq=about-dining&orientation=portrait"
                alt="스페인 다이닝 경험"
                className="w-full h-[400px] sm:h-[500px] lg:h-[600px] object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C2A23]/20 to-transparent" />
            </div>
            
            {/* 연출된 이미지 안내 문구 */}
            <p className="text-xs sm:text-sm text-center mt-3 sm:mt-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(12, 42, 35, 0.6)' }}>
              * 위 이미지는 연출된 이미지입니다
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
