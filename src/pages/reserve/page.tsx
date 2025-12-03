import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationInfoModal from './components/ReservationInfoModal';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import NotificationToast from '../../components/NotificationToast';

// 환경 변수 확인
const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('VITE_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
}

export default function ReservePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    requests: ''
  });

  // 예약 완료 후 표시할 정보 저장
  const [submittedData, setSubmittedData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    requests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [availabilityInfo, setAvailabilityInfo] = useState<{
    available: boolean;
    remainingTables: number;
  } | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Check if modal should be shown
    const hideUntil = localStorage.getItem('hideReservationInfoModalUntil');
    const now = Date.now();
    
    if (!hideUntil || now > parseInt(hideUntil)) {
      setShowInfoModal(true);
    }

    const calculateCountdown = () => {
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      
      // 2025년 12월 1일 오전 10시 30분 (한국 시간)
      const targetDate = new Date('2025-12-01T10:30:00+09:00');
      const targetKoreaTime = new Date(targetDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      
      const difference = targetKoreaTime.getTime() - koreaTime.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
        setIsReservationOpen(false);
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsReservationOpen(true);
        // 예약 오픈 시간이 되면 자동 새로고침
        if (difference > -1000 && difference <= 0) {
          window.location.reload();
        }
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInfoModalConfirm = () => {
    setShowInfoModal(false);
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

  // 예약 가능 여부 확인
  useEffect(() => {
    if (formData.date && formData.time) {
      checkAvailability();
    } else {
      setAvailabilityInfo(null);
    }
  }, [formData.date, formData.time]);

  const checkAvailability = async () => {
    if (!formData.date || !formData.time) return;

    if (!SUPABASE_URL) {
      console.error('Supabase URL이 설정되지 않았습니다.');
      setIsCheckingAvailability(false);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAvailabilityInfo({
          available: data.available,
          remainingTables: data.remainingTables,
        });
      }
    } catch (error) {
      console.error('예약 가능 여부 확인 실패:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 예약 오픈 시간 확인
    if (!isReservationOpen) {
      alert('예약 오픈 시간이 아닙니다. 잠시만 기다려주세요.');
      return;
    }
    
    // 예약 가능 여부 재확인
    if (availabilityInfo && !availabilityInfo.available) {
      alert('해당 시간대는 예약이 마감되었습니다. 다른 시간을 선택해주세요.');
      return;
    }
    
    if (!SUPABASE_URL) {
      alert('환경 설정 오류가 발생했습니다. 페이지를 새로고침해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-reservation`, {
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
          requests: formData.requests,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 제출된 데이터 저장 (폼 초기화 전에!)
        setSubmittedData({ ...formData });
        setSubmitStatus('success');
        // 폼 초기화
        setFormData({
          name: '',
          phone: '',
          email: '',
          date: '',
          time: '',
          guests: '2',
          requests: ''
        });
        setAvailabilityInfo(null);
      } else {
        setSubmitStatus('error');
        alert(data.error || '예약 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('예약 실패:', error);
      setSubmitStatus('error');
      alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time) {
      alert('날짜와 시간을 선택해주세요.');
      return;
    }

    setIsSubmittingWaitlist(true);

    try {
      if (!SUPABASE_URL) {
        setNotification({
          message: '환경 설정 오류가 발생했습니다. 페이지를 새로고침해주세요.',
          type: 'error'
        });
        setIsSubmittingWaitlist(false);
        return;
      }

      // 전화번호에서 하이픈 제거 (대기열은 숫자만 저장)
      const phoneNumber = formData.phone.replace(/[^\d]/g, '');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/add-waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: phoneNumber,
          email: formData.email,
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests),
          requests: formData.requests,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowWaitlistModal(false);
        // 폼 초기화
        setFormData({
          name: '',
          phone: '',
          email: '',
          date: '',
          time: '',
          guests: '2',
          requests: ''
        });
        setAvailabilityInfo(null);
        // 성공 알림 표시
        setNotification({
          message: `대기열 ${data.waitlist.position}번째로 등록되었습니다! 취소 예약이 발생하면 연락드리겠습니다.`,
          type: 'success'
        });
      } else {
        setNotification({
          message: data.error || '대기열 등록 중 오류가 발생했습니다.',
          type: 'error'
        });
      }
    } catch (error) {
      setNotification({
        message: `대기열 등록 중 오류가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        type: 'error'
      });
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  // 예약 완료 페이지에서는 submittedData 사용
  const displayData = submitStatus === 'success' ? submittedData : formData;
  const guestCount = parseInt(displayData.guests);
  const totalAmount = guestCount * 66000;
  const depositAmount = guestCount * 10000;

  // 시간 슬롯 정보 가져오기
  const getTimeSlotInfo = (timeValue: string) => {
    const allTimeSlots = [
      { value: '11:00', time: '11:00 ~ 12:30', label: '런치 1부' },
      { value: '12:30', time: '12:30 ~ 14:00', label: '런치 2부' },
      { value: '14:00', time: '14:00 ~ 15:30', label: '런치 3부' },
      { value: '17:00', time: '17:00 ~ 18:30', label: '디너 1부' },
      { value: '18:30', time: '18:30 ~ 20:00', label: '디너 2부' },
      { value: '20:00', time: '20:00 ~ 21:30', label: '디너 3부' }
    ];
    const slot = allTimeSlots.find(s => s.value === timeValue);
    return slot ? `${slot.time} (${slot.label})` : timeValue;
  };

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
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

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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
            <div className="p-5 sm:p-8 space-y-6">
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
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0C2A23] mb-4 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#CBB676' }}>
                    <i className="ri-file-list-3-line text-white text-base"></i>
                  </div>
                  예약 정보
                </h3>
                <div className="bg-[#FAFAFA] rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-[#0C2A23]/10">
                    <span className="text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      예약자명
                    </span>
                    <span className="text-base font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      {submittedData.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-[#0C2A23]/10">
                    <span className="text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      연락처
                    </span>
                    <span className="text-base font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      {formatPhoneNumber(submittedData.phone)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start pb-3 border-b border-[#0C2A23]/10">
                    <span className="text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      예약 날짜
                    </span>
                    <div className="text-right">
                      <span className="text-base font-semibold text-[#0C2A23] block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        {submittedData.date === '2025-12-24' ? '12월 24일 (수) 크리스마스 이브' : '12월 25일 (목) 크리스마스'}
                      </span>
                      <span className="text-sm font-medium text-[#FF6B35] mt-1 block" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        {getTimeSlotInfo(submittedData.time)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      인원
                    </span>
                    <span className="text-base font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      {submittedData.guests}명
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0C2A23] mb-4 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  <div className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#CBB676' }}>
                    <i className="ri-bank-card-line text-white text-base"></i>
                  </div>
                  예약금 입금 안내
                </h3>
                
                {/* Deposit Amount - Compact */}
                <div className="bg-gradient-to-r from-[#CBB676] to-[#d4c285] rounded-xl p-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-white/90 mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      입금하실 금액
                    </p>
                    <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      {depositAmount.toLocaleString()}원
                    </p>
                    <p className="text-xs text-white/80" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      (1인 10,000원 × {guestCount}명)
                    </p>
                  </div>
                </div>

                {/* Bank Account */}
                <div className="bg-[#FFF4E6] border-2 border-[#CBB676] rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <span className="text-sm font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      입금 계좌
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        은행
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        카카오뱅크
                      </span>
                    </div>
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 cursor-pointer group"
                      onClick={() => {
                        navigator.clipboard.writeText('카카오뱅크 3333-06-3646617');
                        alert('계좌번호가 복사되었습니다!');
                      }}
                    >
                      <span className="text-xs sm:text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        계좌번호
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-bold text-[#0C2A23] group-hover:text-[#CBB676] transition-colors duration-300 whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                          3333-06-3646617
                        </span>
                        <i className="ri-file-copy-line text-[#CBB676] text-sm"></i>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-[#0C2A23]/70" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        예금주
                      </span>
                      <span className="text-sm sm:text-base font-bold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                        강의정
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-[#CBB676] text-base mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs sm:text-sm text-[#0C2A23]/80 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      입금자명은 <strong className="font-bold text-[#0C2A23]">예약자명({submittedData.name})</strong>과 동일하게 입금해주세요.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-[#CBB676] text-base mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs sm:text-sm text-[#0C2A23]/80 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      나머지 금액은 현장에서 결제하시면 됩니다.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-[#CBB676] text-base mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs sm:text-sm text-[#0C2A23]/80 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      입금 확인 후 예약 확정 문자를 발송해드립니다.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <i className="ri-information-line text-[#CBB676] text-base mt-0.5 flex-shrink-0"></i>
                    <p className="text-xs sm:text-sm text-[#0C2A23]/80 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      예약 확정 후 5일 전까지 100% 환불 가능합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-[#F0F4FF] rounded-xl p-4 sm:p-5">
                <h4 className="text-base font-bold text-[#0C2A23] mb-3 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  <i className="ri-customer-service-2-line text-[#CBB676] text-lg"></i>
                  문의사항이 있으신가요?
                </h4>
                <p className="text-sm text-[#0C2A23]/80 leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  예약 관련 문의사항이 있으시면 언제든지 연락주세요.<br />
                  빠르게 도와드리겠습니다.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  onClick={() => window.REACT_APP_NAVIGATE('/')}
                  className="flex-1 px-6 py-3 bg-white border-2 border-[#0C2A23] text-[#0C2A23] font-semibold rounded-xl hover:bg-[#0C2A23] hover:text-white transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  <i className="ri-home-line text-lg"></i>
                  홈으로 돌아가기
                </button>
                <a 
                  href="https://www.instagram.com/riorio_oficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white font-semibold rounded-xl hover:from-[#C13584] hover:to-[#833AB4] transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  <i className="ri-instagram-line text-lg"></i>
                  인스타그램 둘러보기
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Info Modal */}
      {showInfoModal && (
        <ReservationInfoModal 
          onClose={() => setShowInfoModal(false)}
          onConfirm={handleInfoModalConfirm}
        />
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowWaitlistModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                대기열 등록
              </h3>
              <button
                onClick={() => setShowWaitlistModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ri-close-line text-xl" style={{ color: '#666666' }}></i>
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FFF4E6' }}>
              <p className="text-sm" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                <strong style={{ color: '#0C2A23' }}>
                  {formData.date === '2025-12-24' ? '12월 24일 (수)' : '12월 25일 (목)'}
                </strong>
                {' '}
                <strong style={{ color: '#0C2A23' }}>{getTimeSlotInfo(formData.time)}</strong>
                {' '}시간대가 마감되어 대기열에 등록합니다.
              </p>
              <p className="text-xs mt-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                취소 예약이 발생하면 연락드리며, 24시간 내 예약 기회를 제공합니다.
              </p>
            </div>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
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
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
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

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  이메일 (선택)
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

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  인원 수 *
                </label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm"
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  특별 요청사항
                </label>
                <textarea
                  name="requests"
                  value={formData.requests}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent resize-none text-sm"
                  placeholder="알레르기, 특별한 날 등 요청사항을 입력해주세요"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWaitlist}
                  className="flex-1 px-4 py-2.5 bg-[#CBB676] text-[#0C2A23] font-semibold rounded-lg hover:bg-[#d4c285] transition-colors disabled:bg-gray-300 disabled:text-gray-500"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  {isSubmittingWaitlist ? '등록 중...' : '대기열 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 알림 토스트 */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <header className="bg-[#0C2A23] text-white py-3 sm:py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              RIORIO
            </h1>
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-[#CBB676] hover:text-white transition-colors duration-300"
            >
              <i className="ri-arrow-left-line text-lg sm:text-xl"></i>
              <span className="text-sm sm:text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                돌아가기
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Course Summary */}
          <div className="bg-gradient-to-r from-[#0C2A23] to-[#3B0D0C] text-white p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
              RIORIO 오픈 스페셜 코스
            </h2>
            <div className="flex items-center justify-center gap-6 sm:gap-8 text-center">
              <div>
                <p className="text-[#CBB676] text-xs sm:text-sm font-medium">소요시간</p>
                <p className="text-base sm:text-lg font-bold">80분</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <p className="text-[#CBB676] text-xs sm:text-sm font-medium">1인 가격</p>
                <p className="text-base sm:text-lg font-bold">66,000원</p>
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                      disabled={!isReservationOpen}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={!isReservationOpen}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="010-1234-5678"
                      style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#0C2A23] mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                      이메일 (선택)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isReservationOpen}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="example@email.com"
                      style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                    />
                  </div>
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
                    <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${!isReservationOpen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#CBB676]'}`} style={{ borderColor: formData.date === '2025-12-24' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-24' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="date"
                        value="2025-12-24"
                        checked={formData.date === '2025-12-24'}
                        onChange={handleInputChange}
                        required
                        disabled={!isReservationOpen}
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
                            12월 24일 (수)
                          </p>
                          <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                            크리스마스 이브
                          </p>
                        </div>
                      </div>
                    </label>
                    <label className={`relative flex items-center p-3 border-2 rounded-lg transition-all duration-300 ${!isReservationOpen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#CBB676]'}`} style={{ borderColor: formData.date === '2025-12-25' ? '#CBB676' : '#E5E5E5', backgroundColor: formData.date === '2025-12-25' ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                      <input
                        type="radio"
                        name="date"
                        value="2025-12-25"
                        checked={formData.date === '2025-12-25'}
                        onChange={handleInputChange}
                        required
                        disabled={!isReservationOpen}
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
                            12월 25일 (목)
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
                        <label key={slot.value} className={`relative flex items-center p-2.5 border-2 rounded-lg transition-all duration-300 ${!isReservationOpen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#CBB676]'}`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                          <input
                            type="radio"
                            name="time"
                            value={slot.value}
                            checked={formData.time === slot.value}
                            onChange={handleInputChange}
                            required
                            disabled={!isReservationOpen}
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
                        <label key={slot.value} className={`relative flex items-center p-2.5 border-2 rounded-lg transition-all duration-300 ${!isReservationOpen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#CBB676]'}`} style={{ borderColor: formData.time === slot.value ? '#CBB676' : '#E5E5E5', backgroundColor: formData.time === slot.value ? 'rgba(203, 182, 118, 0.05)' : '#FFFFFF' }}>
                          <input
                            type="radio"
                            name="time"
                            value={slot.value}
                            checked={formData.time === slot.value}
                            onChange={handleInputChange}
                            required
                            disabled={!isReservationOpen}
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

                {/* Availability Status */}
                {availabilityInfo && isReservationOpen && (
                  <div className={`mb-3 p-3 rounded-lg border-2 ${availabilityInfo.available ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`${availabilityInfo.available ? 'ri-checkbox-circle-line text-green-600' : 'ri-close-circle-line text-red-600'} text-lg`}></i>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${availabilityInfo.available ? 'text-green-800' : 'text-red-800'}`} style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                          {availabilityInfo.available ? '예약 가능' : '예약 마감'}
                        </p>
                        <p className={`text-xs ${availabilityInfo.available ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                          {availabilityInfo.available 
                            ? `남은 테이블: ${availabilityInfo.remainingTables}개` 
                            : '다른 시간을 선택해주세요'}
                        </p>
                      </div>
                    </div>
                    {!availabilityInfo.available && formData.date && formData.time && (
                      <button
                        type="button"
                        onClick={() => setShowWaitlistModal(true)}
                        className="mt-2 w-full px-4 py-2 bg-[#CBB676] text-[#0C2A23] font-semibold rounded-lg hover:bg-[#d4c285] transition-colors duration-300 text-sm"
                        style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                      >
                        <i className="ri-time-line mr-1"></i>
                        대기열에 등록하기
                      </button>
                    )}
                  </div>
                )}

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
                      disabled={!isReservationOpen}
                      className="w-full px-3 py-2.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent appearance-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isReservationOpen}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB676] focus:border-transparent resize-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="알레르기, 특별한 날 등 요청사항을 입력해주세요 (최대 500자)"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                />
              </div>

              {/* Total Price */}
              <div className="bg-[#FAFAFA] rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                    1인 가격
                  </span>
                  <span className="text-base font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                    66,000원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                    선택 인원
                  </span>
                  <span className="text-base font-semibold text-[#0C2A23]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                    {guestCount}명
                  </span>
                </div>
                <div className="border-t border-[#0C2A23]/10 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                      예약금 (1인 10,000원)
                    </span>
                    <span className="text-base font-bold" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                      {depositAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#0C2A23]/70 mt-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                  와인 페어링 및 서비스료 포함
                </p>
              </div>

              {/* Countdown and Submit Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Countdown Timer - Always visible */}
                <div className="w-full sm:flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2" style={{ backgroundColor: 'rgba(203, 182, 118, 0.1)', borderColor: '#CBB676' }}>
                  <span className="text-xs font-medium whitespace-nowrap" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                    {isReservationOpen ? '예약 진행 중' : '예약 오픈까지'}
                  </span>
                  {!isReservationOpen && (
                    <div className="flex items-center gap-1">
                      {countdown.days > 0 && (
                        <>
                          <span className="text-base font-bold w-5 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                            {countdown.days}
                          </span>
                          <span className="text-xs font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>일</span>
                        </>
                      )}
                      <span className="text-base font-bold w-5 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                        {countdown.hours.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>:</span>
                      <span className="text-base font-bold w-5 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                        {countdown.minutes.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs font-medium" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>:</span>
                      <span className="text-base font-bold w-5 text-center" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#CBB676' }}>
                        {countdown.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isReservationOpen || (availabilityInfo && !availabilityInfo.available)}
                  className="w-full sm:w-auto bg-[#CBB676] text-[#0C2A23] font-bold text-base py-3 px-8 rounded-xl hover:bg-[#d4c285] transition-colors duration-300 touch-manipulation disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}
                >
                  {isSubmitting ? '처리 중...' : isReservationOpen ? '예약하기' : '예약 대기 중'}
                </button>
              </div>

              <p className="text-xs text-[#0C2A23]/60 text-center leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif' }}>
                예약 확정 후 5일 전까지 100% 환불 가능합니다.<br />
                이후 취소 시 취소 수수료가 발생할 수 있습니다.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
