import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#0C2A23' }}>
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-6 sm:mb-8">
          <h1 
            className="text-8xl sm:text-9xl md:text-[12rem] font-bold leading-none"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: '#CBB676',
              textShadow: '0 2px 8px rgba(203, 182, 118, 0.15)'
            }}
          >
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8 sm:mb-12">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: '#FFFFFF'
            }}
          >
            페이지를 찾을 수 없습니다
          </h2>
          <p 
            className="text-base sm:text-lg md:text-xl leading-relaxed"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            요청하신 페이지가 존재하지 않거나<br className="hidden sm:block" />
            이동되었을 수 있습니다.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="flex-1 max-w-20 sm:max-w-32">
            <div className="h-px bg-gradient-to-r from-transparent via-[#CBB676] to-transparent opacity-60"></div>
          </div>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#CBB676', opacity: 0.8 }}></div>
          <div className="flex-1 max-w-20 sm:max-w-32">
            <div className="h-px bg-gradient-to-l from-transparent via-[#CBB676] to-transparent opacity-60"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center">
          <Link
            to="/"
            className="group px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg whitespace-nowrap"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              backgroundColor: '#CBB676',
              color: '#0C2A23'
            }}
          >
            <i className="ri-home-line mr-2"></i>
            홈으로 돌아가기
          </Link>
        </div>

        {/* Additional Help Text */}
        <div className="mt-8 sm:mt-12">
          <p 
            className="text-sm sm:text-base"
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            문의사항이 있으시면{' '}
            <a 
              href="https://www.instagram.com/riorio_oficial/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-[#CBB676] transition-colors duration-300"
              style={{ color: '#CBB676' }}
            >
              인스타그램
            </a>
            {' '}으로 연락주세요
          </p>
        </div>
      </div>
    </div>
  );
}
