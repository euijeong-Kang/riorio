import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Reservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  requests: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function MyReservationPage() {
  const [phone, setPhone] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 전화번호 포맷팅 함수
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/[^\d]/g, '');
    const limited = numbers.slice(0, 11);
    
    let formatted = limited;
    if (limited.length > 3 && limited.length <= 7) {
      formatted = `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else if (limited.length > 7) {
      formatted = `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
    }
    
    setPhone(formatted);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/get-my-reservation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: phone.trim() }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setReservations(data.reservations);
      } else {
        setReservations([]);
      }
      setSearched(true);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      alert('예약 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'confirmed':
        return '승인완료';
      case 'approved':
        return '승인완료';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '입금대기';
      case 'paid':
        return '입금완료';
      case 'confirmed':
        return '승인완료';
      case 'approved':
        return '승인완료';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'text-emerald-600 bg-emerald-50';
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'paid':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <i className="ri-restaurant-2-line text-white text-xl"></i>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                리오리오
              </span>
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-2"
            >
              <span className="text-sm font-medium">홈으로</span>
              <i className="ri-home-line text-lg"></i>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            내 예약 확인
          </h1>
          <p className="text-lg text-gray-600">
            예약 시 입력하신 전화번호로 예약 내역을 조회하실 수 있습니다
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-500">
                예약 시 입력하신 전화번호를 입력해주세요
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  <span>조회 중...</span>
                </>
              ) : (
                <>
                  <i className="ri-search-line"></i>
                  <span>예약 조회하기</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-6">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-calendar-close-line text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  예약 내역이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  입력하신 전화번호로 등록된 예약이 없습니다
                </p>
                <Link
                  to="/reserve"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all whitespace-nowrap"
                >
                  <i className="ri-calendar-check-line"></i>
                  <span>예약하러 가기</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    예약 내역 ({reservations.length}건)
                  </h2>
                </div>

                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <i className="ri-calendar-check-line text-white text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {reservation.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            예약번호: {reservation.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            reservation.payment_status
                          )}`}
                        >
                          {getPaymentStatusText(reservation.payment_status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3 text-gray-700">
                        <i className="ri-calendar-line text-emerald-600"></i>
                        <span className="text-sm">
                          {new Date(reservation.reservation_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                        <i className="ri-time-line text-emerald-600"></i>
                        <span className="text-sm">{reservation.reservation_time}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                        <i className="ri-group-line text-emerald-600"></i>
                        <span className="text-sm">{reservation.guests}명</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-700">
                        <i className="ri-phone-line text-emerald-600"></i>
                        <span className="text-sm">{reservation.phone}</span>
                      </div>
                    </div>

                    {reservation.requests && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-1">특별 요청사항</p>
                        <p className="text-sm text-gray-600">{reservation.requests}</p>
                      </div>
                    )}

                    {reservation.payment_status === 'pending' && reservation.status !== 'cancelled' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <i className="ri-information-line text-amber-600 text-xl mt-0.5"></i>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-2">
                              예약금 입금 안내
                            </p>
                            <p className="text-sm text-amber-800 mb-2">
                              예약 확정을 위해 예약금을 입금해주세요.
                            </p>
                            <div className="bg-white rounded-lg p-3 space-y-1">
                              <p className="text-sm text-gray-700">
                                <strong>은행:</strong> 카카오뱅크
                              </p>
                              <p className="text-sm text-gray-700">
                                <strong>계좌번호:</strong> 3333-06-3646617
                              </p>
                              <p className="text-sm text-gray-700">
                                <strong>예금주:</strong> 강의정
                              </p>
                              <p className="text-sm text-gray-700 mt-2">
                                <strong>입금 금액:</strong> {(reservation.guests * 10000).toLocaleString()}원 (1인 10,000원)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {reservation.status !== 'cancelled' && (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">
                          예약 취소 문의는 예약 확정 안내 받으신 번호로 연락 부탁드립니다.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}