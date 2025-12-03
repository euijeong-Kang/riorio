export default function Footer() {
  return (
    <footer className="py-12 sm:py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: '#0C2A23', color: '#FFFFFF' }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#CBB676' }}>
              RIORIO
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.8)' }}>
              Tapas & Wine Casual Dining
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
              Contact
            </h4>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              <p className="flex items-start gap-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <i className="ri-map-pin-line mt-0.5 flex-shrink-0" style={{ color: '#CBB676' }}></i>
                <span>경기도 광명시 양지로 11 A-142</span>
              </p>
              <p className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <i className="ri-phone-line flex-shrink-0" style={{ color: '#CBB676' }}></i>
                <span>+82 2-1234-5678</span>
              </p>
              <p className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <i className="ri-mail-line flex-shrink-0" style={{ color: '#CBB676' }}></i>
                <span>morningcomet@naver.com</span>
              </p>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
              Opening Hours
            </h4>
            <div className="space-y-1 sm:space-y-2 text-sm sm:text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.8)' }}>
              <p>Mon–Sun  11:00 – 24:00</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
              Follow Us
            </h4>
            <div className="flex gap-3 sm:gap-4">
              <a href="https://www.instagram.com/riorio_oficial/" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <i className="ri-instagram-line text-base sm:text-lg group-hover:text-[#0C2A23]" style={{ color: '#FFFFFF' }}></i>
              </a>
              <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <i className="ri-facebook-fill text-base sm:text-lg group-hover:text-[#0C2A23]" style={{ color: '#FFFFFF' }}></i>
              </a>
              <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <i className="ri-kakao-talk-fill text-base sm:text-lg group-hover:text-[#0C2A23]" style={{ color: '#FFFFFF' }}></i>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 sm:mt-12 pt-6 sm:pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-center sm:text-left" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
              © 2025 RioRio Restaurant. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#" className="hover:scale-105 transition-all duration-300" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                Privacy Policy
              </a>
              <a href="#" className="hover:scale-105 transition-all duration-300" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                Terms of Service
              </a>
              <a href="https://readdy.ai/?origin=logo" className="hover:scale-105 transition-all duration-300" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: 'rgba(255, 255, 255, 0.6)' }}>
                Website Builder
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}