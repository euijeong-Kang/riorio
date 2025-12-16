import { useState, useEffect, useRef } from 'react';

export default function CoursePreview() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  const courses = [
    {
      icon: '🥂',
      course: 'Welcome',
      name: '웰컴 드링크',
      description: '호메세라 브룻 까바, 식전빵',
      wine: '1. 호메세라 브룻 까바'
    },
    {
      icon: '🍽️',
      course: 'Tapas',
      name: '크로케타스 2pcs / 양송이구이 2pcs',
      description: '인당 2pcs 제공',
      wine: '2. 알프레드 마에스트로 로바모르'
    },
    {
      icon: '🥗',
      course: 'Primer Plato',
      name: '부라타 치즈 샐러드',
      description: '신선한 부라타와 토마토, 올리브 오일',
      wine: '2. 알프레드 마에스트로 로바모르'
    },
    {
      icon: '🐙',
      course: 'Segundo Plato',
      name: '뽈뽀 아 라 가예가',
      description: '스페인 갈리시아식 문어 요리',
      wine: '3. 화이트 와인'
    },
    {
      icon: '🦪',
      course: 'Arroz',
      name: '전복 빠에야',
      description: '전복을 사용한 리오리오 시그니처 빠에야',
      wine: '3. 화이트 와인'
    },
    {
      icon: '🥩',
      course: 'Principal',
      name: '이베리코 스테이크',
      description: '베요타 등급 이베리코 스테이크',
      wine: '4. 라 리오하 알타 비냐 알베르디 리세르바'
    },
    {
      icon: '🍰',
      course: 'Postre',
      name: '바스크 치즈케이크',
      description: '스페인 북부식 디저트',
      wine: '5. 디저트 와인'
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="py-16 sm:py-20 lg:py-24 xl:py-32 overflow-hidden" 
      style={{ backgroundColor: '#0C2A23' }}
      data-section="course_preview"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
            RioRio의 스페인 다이닝 경험
            <span className="block mt-2" style={{ color: '#CBB676' }}>7코스 5종 와인 페어링</span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.8)' }}>
            조화로운 식사를 위해 각 코스는 엄선된 스페인 와인과 정성스럽게 페어링됩니다.
          </p>
        </div>

        {/* Course Table - Mobile Optimized */}
        <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Mobile View - Card Layout */}
          <div className="block lg:hidden space-y-4">
            {courses.map((course, index) => (
              <div key={index} className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                        {course.course}
                      </h3>
                      <span className="text-xs font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {course.wine}
                      </span>
                    </div>
                    <h4 className="font-semibold text-base mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                      {course.name}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {course.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <th className="text-left py-4 px-6 font-semibold text-lg" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>Course</th>
                  <th className="text-left py-4 px-6 font-semibold text-lg" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>메뉴명</th>
                  <th className="text-left py-4 px-6 font-semibold text-lg" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>상세</th>
                  <th className="text-left py-4 px-6 font-semibold text-lg" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>와인 페어링</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <tr key={index} className="border-b hover:bg-white/5 transition-colors duration-300" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{course.icon}</span>
                        <span className="font-medium text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                          {course.course}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6 font-semibold text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#FFFFFF' }}>
                      {course.name}
                    </td>
                    <td className="py-6 px-6 text-base leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {course.description}
                    </td>
                    <td className="py-6 px-6 font-medium text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                      {course.wine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wine Serving Info */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.5)' }}>
              리오리오 크리스마스 오픈 코스는 7코스 요리와 5잔 와인 페어링으로 구성되어 있습니다.<br />
              와인 서빙 기준은 1인당 까바 60ml · 오렌지 와인 60ml · 화이트 80ml · 레드 80ml · 디저트 와인 30ml 정도가 제공됩니다.<br />
              와인 양은 손님 취향과 현장 상황에 따라 소폭 조절될 수 있습니다.
            </p>
          </div>

          {/* Footnote */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
              *코스 구성은 재료 수급 상황에 따라 일부 변경될 수 있습니다.<br />
              *현재 와인 시음과 셀렉을 진행 중에 있으며, 조화로운 페어링을 위해 결정되는 순서에 따라 업데이트 해드리겠습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
