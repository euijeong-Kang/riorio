import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

interface ReservationData {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  requests: string;
}

export default function ReservationSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reservationData = location.state?.reservationData as ReservationData;

  useEffect(() => {
    // 예약 데이터가 없으면 홈으로 리다이렉트
    if (!reservationData) {
      navigate('/');
    }
  }, [reservationData, navigate]);

  if (!reservationData) {
    return null;
  }

  const guestCount = parseInt(reservationData.guests);
  const totalAmount = guestCount * 66000;
  const depositAmount = guestCount * 10000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="bg-[#0C2A23] text-white py-3 sm:py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              RIORIO
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-[#0C2A23] to-[#3B0D0C] text-white p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#CBB676] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-white text-3xl sm:text-4xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
            예약 신청이 완료되었습니다
          </h1>
          <p className="text-sm sm:text-base text-white/80" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
            예약금 입금 후 최종 예약이 확정됩니다
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Important Notice */}
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 flex-shrink-0 mt-0.5">
                <i className="ri-alarm-warning-line text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-red-800 mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  중요 안내
                </h3>
                <p className="text-sm sm:text-base text-red-700 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  예약 신청 후 <strong className="font-bold">1시간 이내</strong>에 예약금을 입금하셔야 최종 예약이 확정됩니다. 시간 내 입금이 확인되지 않으면 예약이 자동 취소될 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Reservation Summary */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">예약자명</span>
              <span className="font-semibold text-gray-900">{reservationData.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">연락처</span>
              <span className="font-semibold text-gray-900">{formatPhoneNumber(reservationData.phone)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">예약 날짜</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{reservationData.date === '2025-12-24' ? '12월 24일 (화) 크리스마스 이브' : '12월 25일 (수) 크리스마스'}</div>
                <div className="text-sm text-orange-600 mt-1">{reservationData.time}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">인원</span>
              <span className="font-semibold text-gray-900">{reservationData.guests}명</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">예약금</span>
              <span className="font-bold text-orange-600 text-lg">{depositAmount.toLocaleString()}원</span>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-bank-card-line text-white text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-3">입금 계좌 안내</h3>
                <div className="bg-white rounded-lg p-4 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-gray-600 text-sm sm:text-base">농협</span>
                    <span className="font-bold text-gray-900 text-base sm:text-lg break-all sm:break-normal">352-1234-5678-90</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-700 font-medium text-sm sm:text-base">예금주: 홍길동</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  입금자명을 <span className="font-semibold text-orange-600">{reservationData.name}</span>으로 입력해주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 나머지 금액 안내 */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-money-dollar-circle-line text-white text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">현장 결제 안내</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  예약금을 제외한 나머지 금액 <span className="font-bold text-blue-600">{(totalAmount - depositAmount).toLocaleString()}원</span>은 현장에서 결제하시면 됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <i className="ri-checkbox-circle-line text-green-500 text-lg flex-shrink-0 mt-0.5"></i>
              <p className="leading-relaxed">입금 확인 후 예약 확정 문자를 보내드립니다.</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <i className="ri-information-line text-blue-500 text-lg flex-shrink-0 mt-0.5"></i>
              <p className="leading-relaxed">예약 취소 시 3일 전까지는 전액 환불, 2일 전 50% 환불, 당일 취소는 환불이 불가합니다.</p>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            홈으로 돌아가기
          </button>
          <a
            href="https://www.instagram.com/riorio_oficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-instagram-line text-xl"></i>
            인스타 둘러보기
          </a>
        </div>
      </div>
    </div>
  );
}
