import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

interface Reservation {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  requests: string | null;
  status: string;
  payment_status: string;
  created_at: string;
}

interface Waitlist {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  requests: string | null;
  status: string;
  position: number;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations');
  const [showWaitlistEditModal, setShowWaitlistEditModal] = useState(false);
  const [selectedWaitlist, setSelectedWaitlist] = useState<Waitlist | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      loadReservations();
      loadWaitlist();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/admin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        loadReservations();
        loadWaitlist();
      } else {
        setLoginError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setLoginError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/get-reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setReservations(data.reservations);
      }
    } catch (error) {
      console.error('예약 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWaitlist = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/get-all-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setWaitlist(data.waitlist || []);
      } else {
        setWaitlist([]);
      }
    } catch (error) {
      setWaitlist([]);
    }
  };

  const updateReservationStatus = async (id: string, payment_status: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-reservation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, payment_status }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadReservations();
      }
    } catch (error) {
      console.error('예약 상태 업데이트 실패:', error);
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('정말 이 예약을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/delete-reservation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadReservations();
      }
    } catch (error) {
      console.error('예약 삭제 실패:', error);
    }
  };

  const updateWaitlist = async (id: string, updateData: Partial<Waitlist>) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, ...updateData }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadWaitlist();
        return true;
      } else {
        alert(data.error || '대기열 수정 중 오류가 발생했습니다.');
        return false;
      }
    } catch (error) {
      console.error('대기열 수정 실패:', error);
      alert('대기열 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const deleteWaitlist = async (id: string) => {
    if (!confirm('정말 이 대기열을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/delete-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();
      if (data.success) {
        loadWaitlist();
      } else {
        alert(data.error || '대기열 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('대기열 삭제 실패:', error);
      alert('대기열 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: '대기중',
      paid: '입금완료',
      approved: '승인완료',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredReservations = reservations.filter((res) => {
    if (filterStatus !== 'all' && res.payment_status !== filterStatus) return false;
    if (filterPayment !== 'all' && res.status !== filterPayment) return false;
    return true;
  });

  const groupedByDate = filteredReservations.reduce((acc, res) => {
    const date = res.reservation_date;
    if (!acc[date]) acc[date] = {};
    const time = res.reservation_time;
    if (!acc[date][time]) acc[date][time] = [];
    acc[date][time].push(res);
    return acc;
  }, {} as Record<string, Record<string, Reservation[]>>);

  // 통계 계산
  const totalGuests = reservations.reduce((sum, res) => sum + res.guests, 0);
  const confirmedGuests = reservations
    .filter(res => res.payment_status === 'approved')
    .reduce((sum, res) => sum + res.guests, 0);
  const pendingGuests = reservations
    .filter(res => res.payment_status === 'pending' || res.payment_status === 'paid')
    .reduce((sum, res) => sum + res.guests, 0);
  const expectedRevenue = totalGuests * 66000; // 1인당 66,000원

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
            <p className="text-gray-600">예약 관리 시스템</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {activeTab === 'reservations' 
                  ? `총 ${reservations.length}건의 예약` 
                  : `총 ${waitlist.length}건의 대기열`}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {activeTab === 'reservations' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-amber-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                  <i className="ri-add-line sm:mr-2"></i>
                  <span className="hidden sm:inline">예약 추가</span>
                  <span className="sm:hidden">추가</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (activeTab === 'reservations') {
                    loadReservations();
                  } else {
                    loadWaitlist();
                  }
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-refresh-line sm:mr-2"></i>
                <span className="hidden sm:inline">새로고침</span>
                <span className="sm:hidden">새로고침</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-red-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-logout-box-line sm:mr-2"></i>
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">로그아웃</span>
              </button>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'reservations'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-calendar-check-line mr-1 sm:mr-2"></i>
              <span className="hidden xs:inline">예약 관리</span>
              <span className="xs:hidden">예약</span>
              <span className="ml-1">({reservations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                activeTab === 'waitlist'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="ri-time-line mr-1 sm:mr-2"></i>
              <span className="hidden xs:inline">대기열 관리</span>
              <span className="xs:hidden">대기열</span>
              <span className="ml-1">({waitlist.length})</span>
            </button>
          </div>

          {/* 필터 - 예약 관리 탭에서만 표시 */}
          {activeTab === 'reservations' && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-4">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">결제 상태:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="pending">대기중</option>
                  <option value="paid">입금완료</option>
                  <option value="approved">승인완료</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* 통계 정보 - 본문 상단 */}
        {activeTab === 'reservations' && reservations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6 px-4 sm:px-6 py-2.5 sm:py-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span className="text-gray-600">총인원:</span>
                <span className="font-semibold text-gray-900">{totalGuests.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">확정인원:</span>
                <span className="font-semibold text-green-600">{confirmedGuests.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">대기인원:</span>
                <span className="font-semibold text-amber-600">{pendingGuests.toLocaleString()}명</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                <i className="ri-money-dollar-circle-line text-green-600"></i>
                <span className="text-gray-600">예상매출:</span>
                <span className="font-semibold text-green-600">{expectedRevenue.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'reservations' ? (
          /* 예약 목록 */
          loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <i className="ri-calendar-line text-6xl text-gray-300"></i>
              <p className="mt-4 text-gray-600">예약이 없습니다.</p>
            </div>
          ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, times]) => (
                <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3">
                    <h2 className="text-base sm:text-lg font-bold">{date}</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {Object.entries(times)
                      .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                      .map(([time, reservationList]) => (
                        <div key={time} className="p-3 sm:p-6">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {time} <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">({reservationList.length}/5 테이블)</span>
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {reservationList.map((reservation) => (
                              <div
                                key={reservation.id}
                                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-amber-300 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                      <h4 className="font-semibold text-sm sm:text-base text-gray-900">{reservation.name}</h4>
                                      {getStatusBadge(reservation.payment_status)}
                                      <span className="text-xs sm:text-sm text-gray-500">
                                        {reservation.guests}명
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                      <p className="break-all">
                                        <i className="ri-phone-line mr-2"></i>
                                        {formatPhoneNumber(reservation.phone)}
                                      </p>
                                      {reservation.email && (
                                        <p className="break-all">
                                          <i className="ri-mail-line mr-2"></i>
                                          {reservation.email}
                                        </p>
                                      )}
                                      {reservation.requests && (
                                        <p className="text-gray-500 break-words">
                                          <i className="ri-message-3-line mr-2"></i>
                                          {reservation.requests}
                                        </p>
                                      )}
                                      <p className="text-[10px] sm:text-xs text-gray-400">
                                        예약일시: {new Date(reservation.created_at).toLocaleString('ko-KR')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                                    <button
                                      onClick={() => handleViewDetail(reservation)}
                                      className="px-2 sm:px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                                    >
                                      상세보기
                                    </button>
                                    {reservation.payment_status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => updateReservationStatus(reservation.id, 'paid')}
                                          className="px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors whitespace-nowrap"
                                        >
                                          입금확인
                                        </button>
                                        <button
                                          onClick={() => updateReservationStatus(reservation.id, 'approved')}
                                          className="px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-200 transition-colors whitespace-nowrap"
                                        >
                                          승인
                                        </button>
                                      </>
                                    )}
                                    {reservation.payment_status === 'paid' && (
                                      <button
                                        onClick={() => updateReservationStatus(reservation.id, 'approved')}
                                        className="px-2 sm:px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-200 transition-colors whitespace-nowrap"
                                      >
                                        승인
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteReservation(reservation.id)}
                                      className="px-2 sm:px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors whitespace-nowrap"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )
        ) : (
          /* 대기열 목록 */
          waitlist.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <i className="ri-time-line text-6xl text-gray-300"></i>
              <p className="mt-4 text-gray-600">대기열이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(
                waitlist.reduce((acc, item) => {
                  const key = `${item.reservation_date}_${item.reservation_time}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                }, {} as Record<string, Waitlist[]>)
              )
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, items]) => {
                  const [date, time] = key.split('_');
                  return (
                    <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3">
                        <h2 className="text-base sm:text-lg font-bold">{date} {time}</h2>
                        <p className="text-xs sm:text-sm text-orange-100 mt-1">
                          대기자 {items.length}명
                        </p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {items.map((item) => {
                          const getWaitlistStatusBadge = (status: string) => {
                            const styles = {
                              waiting: 'bg-amber-100 text-amber-800',
                              notified: 'bg-blue-100 text-blue-800',
                              converted: 'bg-green-100 text-green-800',
                              cancelled: 'bg-gray-100 text-gray-800',
                            };
                            const labels = {
                              waiting: '대기 중',
                              notified: '알림 발송',
                              converted: '예약 완료',
                              cancelled: '취소됨',
                            };
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                                {labels[status as keyof typeof labels]}
                              </span>
                            );
                          };

                          const isExpired = item.status === 'notified' && item.expires_at && new Date(item.expires_at) < new Date();

                          return (
                            <div
                              key={item.id}
                              className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">{item.name}</h4>
                                    {getWaitlistStatusBadge(item.status)}
                                    <span className="text-xs sm:text-sm font-medium text-orange-600">
                                      {item.position}번째
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      {item.guests}명
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                    <p className="break-all">
                                      <i className="ri-phone-line mr-2"></i>
                                      {formatPhoneNumber(item.phone)}
                                    </p>
                                    {item.email && (
                                      <p className="break-all">
                                        <i className="ri-mail-line mr-2"></i>
                                        {item.email}
                                      </p>
                                    )}
                                    {item.requests && (
                                      <p className="text-gray-500 break-words">
                                        <i className="ri-message-3-line mr-2"></i>
                                        {item.requests}
                                      </p>
                                    )}
                                    {item.status === 'notified' && item.notified_at && (
                                      <p className="text-[10px] sm:text-xs text-blue-600">
                                        <i className="ri-notification-line mr-1"></i>
                                        알림 발송: {new Date(item.notified_at).toLocaleString('ko-KR')}
                                        {isExpired && <span className="text-red-600 ml-2">(만료됨)</span>}
                                      </p>
                                    )}
                                    {item.status === 'notified' && item.expires_at && !isExpired && (
                                      <p className="text-[10px] sm:text-xs text-blue-600">
                                        <i className="ri-time-line mr-1"></i>
                                        예약 가능 기한: {new Date(item.expires_at).toLocaleString('ko-KR')}
                                      </p>
                                    )}
                                    <p className="text-[10px] sm:text-xs text-gray-400">
                                      등록일시: {new Date(item.created_at).toLocaleString('ko-KR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                                  <button
                                    onClick={() => {
                                      setSelectedWaitlist(item);
                                      setShowWaitlistEditModal(true);
                                    }}
                                    className="px-2 sm:px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors whitespace-nowrap"
                                  >
                                    <i className="ri-edit-line mr-1"></i>
                                    수정
                                  </button>
                                  <button
                                    onClick={() => deleteWaitlist(item.id)}
                                    className="px-2 sm:px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors whitespace-nowrap"
                                  >
                                    <i className="ri-delete-bin-line mr-1"></i>
                                    삭제
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )
        )}
      </main>

      {/* 대기열 수정 모달 */}
      {showWaitlistEditModal && selectedWaitlist && (
        <WaitlistEditModal
          waitlist={selectedWaitlist}
          onClose={() => {
            setShowWaitlistEditModal(false);
            setSelectedWaitlist(null);
          }}
          onSuccess={() => {
            setShowWaitlistEditModal(false);
            setSelectedWaitlist(null);
            loadWaitlist();
          }}
        />
      )}

      {/* 예약 추가 모달 */}
      {showAddModal && (
        <AddReservationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadReservations();
          }}
        />
      )}

      {/* 예약 상세 모달 */}
      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
          onSuccess={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
            loadReservations();
          }}
        />
      )}

      {/* 대기열 수정 모달 */}
      {showWaitlistEditModal && selectedWaitlist && (
        <WaitlistEditModal
          waitlist={selectedWaitlist}
          onClose={() => {
            setShowWaitlistEditModal(false);
            setSelectedWaitlist(null);
          }}
          onSuccess={() => {
            setShowWaitlistEditModal(false);
            setSelectedWaitlist(null);
            loadWaitlist();
          }}
        />
      )}
    </div>
  );
}

interface ReservationDetailModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

function ReservationDetailModal({ reservation, onClose, onSuccess }: ReservationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: reservation.name,
    phone: reservation.phone,
    email: reservation.email || '',
    date: reservation.reservation_date,
    time: reservation.reservation_time,
    guests: reservation.guests.toString(),
    payment_status: reservation.payment_status,
    requests: reservation.requests || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lunchTimes = [
    { label: '1부', value: '11:00', time: '11:00 ~ 12:30' },
    { label: '2부', value: '12:30', time: '12:30 ~ 14:00' },
    { label: '3부', value: '14:00', time: '14:00 ~ 15:30' }
  ];

  const dinnerTimes = [
    { label: '1부', value: '17:00', time: '17:00 ~ 18:30' },
    { label: '2부', value: '18:30', time: '18:30 ~ 20:00' },
    { label: '3부', value: '20:00', time: '20:00 ~ 21:30' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-reservation-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reservation.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests),
          payment_status: formData.payment_status,
          requests: formData.requests,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('예약이 수정되었습니다!');
        onSuccess();
      } else {
        alert(data.error || '예약 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('예약 수정 실패:', error);
      alert('예약 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: '대기중',
      paid: '입금완료',
      approved: '승인완료',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#0C2A23] to-[#3B0D0C] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
            예약 상세 정보
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-edit-line sm:mr-2"></i>
                <span className="hidden sm:inline">수정</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl sm:text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* 예약 ID 및 생성일 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">예약 ID</span>
              <span className="text-sm text-gray-900 font-mono">{reservation.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">예약 생성일</span>
              <span className="text-sm text-gray-900">{new Date(reservation.created_at).toLocaleString('ko-KR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">현재 상태</span>
              {getStatusBadge(reservation.payment_status)}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              예약자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  성함 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-600"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-600"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-600"
                style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
              />
            </div>
          </div>

          {/* Reservation Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              예약 정보
            </h3>
            
            {/* Date Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                예약 날짜 *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.date === '2025-12-24' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-24' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                  <input
                    type="radio"
                    name="date"
                    value="2025-12-24"
                    checked={formData.date === '2025-12-24'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2.5 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.date === '2025-12-24' ? '#CBB676' : '#D1D5DB' }}>
                      {formData.date === '2025-12-24' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        12월 24일 (화)
                      </p>
                      <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        크리스마스 이브
                      </p>
                    </div>
                  </div>
                </label>
                <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.date === '2025-12-25' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-25' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                  <input
                    type="radio"
                    name="date"
                    value="2025-12-25"
                    checked={formData.date === '2025-12-25'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2.5 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.date === '2025-12-25' ? '#CBB676' : '#D1D5DB' }}>
                      {formData.date === '2025-12-25' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        12월 25일 (수)
                      </p>
                      <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        크리스마스
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                예약 시간 *
              </label>
              
              {/* Lunch Times */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#FFF4E6' }}>
                    <i className="ri-sun-line text-xs" style={{ color: '#CBB676' }}></i>
                  </div>
                  <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    런치 타임
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lunchTimes.map((slot) => (
                    <label key={slot.value} className={`relative flex items-center p-2.5 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="time"
                        value={slot.value}
                        checked={formData.time === slot.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#D1D5DB' }}>
                          {formData.time === slot.value && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {slot.label}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                            {slot.time}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dinner Times */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#F0F4FF' }}>
                    <i className="ri-moon-line text-xs" style={{ color: '#0C2A23' }}></i>
                  </div>
                  <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    디너 타임
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dinnerTimes.map((slot) => (
                    <label key={slot.value} className={`relative flex items-center p-2.5 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="time"
                        value={slot.value}
                        checked={formData.time === slot.value}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#D1D5DB' }}>
                          {formData.time === slot.value && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {slot.label}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                            {slot.time}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                인원 수 * (최소 2명)
              </label>
              <div className="relative">
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-3 py-2.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent appearance-none text-sm disabled:bg-gray-50 disabled:text-gray-600"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명</option>
                  <option value="5">5명</option>
                  <option value="6">6명</option>
                  <option value="7">7명</option>
                  <option value="8">8명</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              결제 상태
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.payment_status === 'pending' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'pending' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="pending"
                  checked={formData.payment_status === 'pending'}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'pending' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'pending' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    대기중
                  </span>
                </div>
              </label>
              <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.payment_status === 'paid' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'paid' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="paid"
                  checked={formData.payment_status === 'paid'}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'paid' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'paid' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    입금완료
                  </span>
                </div>
              </label>
              <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#CBB676]' : 'cursor-not-allowed'}`} style={{ borderColor: formData.payment_status === 'approved' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'approved' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="approved"
                  checked={formData.payment_status === 'approved'}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'approved' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'approved' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    승인완료
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              특별 요청사항
            </label>
            <textarea
              name="requests"
              value={formData.requests}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent resize-none text-sm disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="알레르기, 특별한 날 등 요청사항을 입력해주세요 (최대 500자)"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: reservation.name,
                      phone: reservation.phone,
                      email: reservation.email || '',
                      date: reservation.reservation_date,
                      time: reservation.reservation_time,
                      guests: reservation.guests.toString(),
                      payment_status: reservation.payment_status,
                      requests: reservation.requests || ''
                    });
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors duration-300 whitespace-nowrap text-sm sm:text-base"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#CBB676] text-white font-semibold rounded-lg sm:rounded-xl hover:bg-[#d4c285] transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  {isSubmitting ? '처리 중...' : '저장'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors duration-300 whitespace-nowrap text-sm sm:text-base"
                style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
              >
                닫기
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddReservationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddReservationModal({ onClose, onSuccess }: AddReservationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    payment_status: 'pending',
    requests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lunchTimes = [
    { label: '1부', value: '11:00', time: '11:00 ~ 12:30' },
    { label: '2부', value: '12:30', time: '12:30 ~ 14:00' },
    { label: '3부', value: '14:00', time: '14:00 ~ 15:30' }
  ];

  const dinnerTimes = [
    { label: '1부', value: '17:00', time: '17:00 ~ 18:30' },
    { label: '2부', value: '18:30', time: '18:30 ~ 20:00' },
    { label: '3부', value: '20:00', time: '20:00 ~ 21:30' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/add-reservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests),
          payment_status: formData.payment_status,
          requests: formData.requests,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('예약이 추가되었습니다!');
        onSuccess();
        onClose();
      } else {
        alert(data.error || '예약 추가 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('예약 추가 실패:', error);
      alert('예약 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#0C2A23] to-[#3B0D0C] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
            예약 추가
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl sm:text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Personal Information */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              예약자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  성함 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm"
                  placeholder="홍길동"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm"
                  placeholder="010-1234-5678"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm"
                placeholder="example@email.com"
                style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
              />
            </div>
          </div>

          {/* Reservation Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              예약 정보
            </h3>
            
            {/* Date Selection - Radio Buttons */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                예약 날짜 *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.date === '2025-12-24' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-24' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                  <input
                    type="radio"
                    name="date"
                    value="2025-12-24"
                    checked={formData.date === '2025-12-24'}
                    onChange={handleInputChange}
                    required
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2.5 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.date === '2025-12-24' ? '#CBB676' : '#D1D5DB' }}>
                      {formData.date === '2025-12-24' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        12월 24일 (화)
                      </p>
                      <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        크리스마스 이브
                      </p>
                    </div>
                  </div>
                </label>
                <label className="relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.date === '2025-12-25' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-25' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                  <input
                    type="radio"
                    name="date"
                    value="2025-12-25"
                    checked={formData.date === '2025-12-25'}
                    onChange={handleInputChange}
                    required
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2.5 w-full">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.date === '2025-12-25' ? '#CBB676' : '#D1D5DB' }}>
                      {formData.date === '2025-12-25' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        12월 25일 (수)
                      </p>
                      <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        크리스마스
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-[#0C2A23] mb-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                예약 시간 *
              </label>
              
              {/* Lunch Times */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#FFF4E6' }}>
                    <i className="ri-sun-line text-xs" style={{ color: '#CBB676' }}></i>
                  </div>
                  <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    런치 타임
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lunchTimes.map((slot) => (
                    <label key={slot.value} className="relative flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="time"
                        value={slot.value}
                        checked={formData.time === slot.value}
                        onChange={handleInputChange}
                        required
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#D1D5DB' }}>
                          {formData.time === slot.value && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {slot.label}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                            {slot.time}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dinner Times */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#F0F4FF' }}>
                    <i className="ri-moon-line text-xs" style={{ color: '#0C2A23' }}></i>
                  </div>
                  <h4 className="text-xs font-semibold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    디너 타임
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dinnerTimes.map((slot) => (
                    <label key={slot.value} className="relative flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="time"
                        value={slot.value}
                        checked={formData.time === slot.value}
                        onChange={handleInputChange}
                        required
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#D1D5DB' }}>
                          {formData.time === slot.value && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                            {slot.label}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                            {slot.time}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                인원 수 * (최소 2명)
              </label>
              <div className="relative">
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent appearance-none text-sm"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명</option>
                  <option value="5">5명</option>
                  <option value="6">6명</option>
                  <option value="7">7명</option>
                  <option value="8">8명</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#0C2A23] mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              결제 상태
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <label className="relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.payment_status === 'pending' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'pending' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="pending"
                  checked={formData.payment_status === 'pending'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'pending' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'pending' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    대기중
                  </span>
                </div>
              </label>
              <label className="relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.payment_status === 'paid' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'paid' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="paid"
                  checked={formData.payment_status === 'paid'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'paid' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'paid' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    입금완료
                  </span>
                </div>
              </label>
              <label className="relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:border-[#CBB676]" style={{ borderColor: formData.payment_status === 'approved' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.payment_status === 'approved' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                <input
                  type="radio"
                  name="payment_status"
                  value="approved"
                  checked={formData.payment_status === 'approved'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300`} style={{ borderColor: formData.payment_status === 'approved' ? '#CBB676' : '#D1D5DB' }}>
                    {formData.payment_status === 'approved' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#CBB676' }}></div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    승인완료
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              특별 요청사항
            </label>
            <textarea
              name="requests"
              value={formData.requests}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent resize-none text-sm"
              placeholder="알레르기, 특별한 날 등 요청사항을 입력해주세요 (최대 500자)"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors duration-300 whitespace-nowrap text-sm sm:text-base"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#CBB676] text-white font-semibold rounded-lg sm:rounded-xl hover:bg-[#d4c285] transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
            >
              {isSubmitting ? '처리 중...' : '예약 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WaitlistEditModalProps {
  waitlist: Waitlist;
  onClose: () => void;
  onSuccess: () => void;
}

function WaitlistEditModal({ waitlist, onClose, onSuccess }: WaitlistEditModalProps) {
  const [formData, setFormData] = useState({
    name: waitlist.name,
    phone: formatPhoneNumber(waitlist.phone),
    email: waitlist.email || '',
    reservation_date: waitlist.reservation_date,
    reservation_time: waitlist.reservation_time,
    guests: waitlist.guests.toString(),
    requests: waitlist.requests || '',
    status: waitlist.status,
    position: waitlist.position.toString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 전화번호 자동 포맷팅
    if (name === 'phone') {
      const numbers = value.replace(/[^\d]/g, '');
      const limited = numbers.slice(0, 11);
      
      let formatted = limited;
      if (limited.length > 3 && limited.length <= 7) {
        formatted = `${limited.slice(0, 3)}-${limited.slice(3)}`;
      } else if (limited.length > 7) {
        formatted = `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: waitlist.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            reservation_date: formData.reservation_date,
            reservation_time: formData.reservation_time,
            guests: parseInt(formData.guests),
            requests: formData.requests || null,
            status: formData.status,
            position: parseInt(formData.position),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('대기열이 수정되었습니다!');
        onSuccess();
      } else {
        alert(data.error || '대기열 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('대기열 수정 실패:', error);
      alert('대기열 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lunchTimes = [
    { label: '1부', value: '11:00', time: '11:00 ~ 12:30' },
    { label: '2부', value: '12:30', time: '12:30 ~ 14:00' },
    { label: '3부', value: '14:00', time: '14:00 ~ 15:30' }
  ];

  const dinnerTimes = [
    { label: '1부', value: '17:00', time: '17:00 ~ 18:30' },
    { label: '2부', value: '18:30', time: '18:30 ~ 20:00' },
    { label: '3부', value: '20:00', time: '20:00 ~ 21:30' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">대기열 수정</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-lg sm:text-xl text-gray-600"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                성함 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                연락처 *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                인원 수 *
              </label>
              <select
                name="guests"
                value={formData.guests}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}명</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                예약 날짜 *
              </label>
              <select
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="2025-12-24">12월 24일 (수) 크리스마스 이브</option>
                <option value="2025-12-25">12월 25일 (목) 크리스마스</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                예약 시간 *
              </label>
              <select
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {lunchTimes.map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label} ({slot.time})</option>
                ))}
                {dinnerTimes.map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label} ({slot.time})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                상태 *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="waiting">대기 중</option>
                <option value="notified">알림 발송</option>
                <option value="converted">예약 완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                대기 순서 *
              </label>
              <input
                type="number"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              특별 요청사항
            </label>
            <textarea
              name="requests"
              value={formData.requests}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="알레르기, 특별한 날 등 요청사항을 입력해주세요"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 text-sm sm:text-base"
            >
              {isSubmitting ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}