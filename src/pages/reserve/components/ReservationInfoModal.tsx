import { useState, useEffect } from 'react';

interface ReservationInfoModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReservationInfoModal({ onClose, onConfirm }: ReservationInfoModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      {/* PC Version */}
      <div 
        className="hidden lg:flex fixed inset-0 z-50 items-center justify-center px-4 py-8 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-4xl rounded-2xl p-8 shadow-2xl my-8"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 cursor-pointer"
            style={{ color: '#666666' }}
          >
            <i className="ri-close-line text-2xl"></i>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              예약 전 안내사항
            </h2>
            <p className="text-base" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              원활한 예약을 위해 아래 내용을 꼭 확인해주세요
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Column - Wine Info + Time Schedule */}
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#3B0D0C' }}>
                  <i className="ri-goblet-line text-lg" style={{ color: '#CBB676' }}></i>
                </div>
                와인 페어링 안내
              </h3>
              <div className="rounded-xl p-4 border mb-4" style={{ backgroundColor: '#FFF4E6', borderColor: '#CBB676' }}>
                <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                  와인을 즐기지 않으셔도 전혀 걱정하지 않으셔도 됩니다. 이번 오픈 기념 코스는 와인 없이 요리만으로도 충분히 제값, 그 이상을 하는 구성으로 준비했습니다.
                </p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                  이번 코스 음식과 페어링 와인은 '추가 옵션'이라기보다, 저희가 오픈을 알리기 위해 홍보비를 보태 함께 준비한 작은 선물 같은 구성에 가깝습니다. 부담 없이 편안하게 코스 요리만 온전히 즐기셔도 좋고, 괜찮으시다면 곁들여 드리는 와인 한 잔 한 잔이 리오리오가 그리는 스페인의 저녁을 조금 더 또렷하게 보여줄 거예요.
                </p>
              </div>

              {/* Time Schedule */}
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#0C2A23' }}>
                  <i className="ri-time-line text-lg" style={{ color: '#CBB676' }}></i>
                </div>
                운영 시간 안내
              </h3>
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <p className="text-xs mb-3" style={{ color: '#666666' }}>서비스 타임 80분 • 정리 타임 10분</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Lunch */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="ri-sun-line text-sm" style={{ color: '#CBB676' }}></i>
                      <span className="text-sm font-semibold" style={{ color: '#0C2A23' }}>런치</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>1부</span>
                        <span style={{ color: '#0C2A23' }}>11:00 ~ 12:30</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>2부</span>
                        <span style={{ color: '#0C2A23' }}>12:30 ~ 14:00</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>3부</span>
                        <span style={{ color: '#0C2A23' }}>14:00 ~ 15:30</span>
                      </div>
                    </div>
                  </div>

                  {/* Dinner */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="ri-moon-line text-sm" style={{ color: '#0C2A23' }}></i>
                      <span className="text-sm font-semibold" style={{ color: '#0C2A23' }}>디너</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>1부</span>
                        <span style={{ color: '#0C2A23' }}>17:00 ~ 18:30</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>2부</span>
                        <span style={{ color: '#0C2A23' }}>18:30 ~ 20:00</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold" style={{ color: '#CBB676' }}>3부</span>
                        <span style={{ color: '#0C2A23' }}>20:00 ~ 21:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Reservation Info */}
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#CBB676' }}>
                  <i className="ri-information-line text-lg" style={{ color: '#FFFFFF' }}></i>
                </div>
                예약 정보 안내
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                  <div className="flex items-start gap-2">
                    <i className="ri-user-line text-base mt-0.5" style={{ color: '#CBB676' }}></i>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        예약자 정보 정확히 기입
                      </p>
                      <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        예약 진행 및 안내를 위해 예약자 분의 성함과 전화번호를 정확히 기입해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                  <div className="flex items-start gap-2">
                    <i className="ri-bank-card-line text-base mt-0.5" style={{ color: '#CBB676' }}></i>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        예약금 안내 (1인 10,000원)
                      </p>
                      <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        정확한 확인을 위해 입금하실 분의 성함과 예약자 성함을 일치하게 작성해주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                  <div className="flex items-start gap-2">
                    <i className="ri-group-line text-base mt-0.5" style={{ color: '#CBB676' }}></i>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        시간대별 5테이블 한정 운영
                      </p>
                      <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        예약하신 시간에 맞춰 입장해 주시기 바랍니다. 원활한 서비스 제공을 위해 시간 엄수 부탁드립니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                  <div className="flex items-start gap-2">
                    <i className="ri-refresh-line text-base mt-0.5" style={{ color: '#CBB676' }}></i>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                        취소 및 환불 규정
                      </p>
                      <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                        예약 확정 후 5일 전까지 100% 환불 가능합니다. 이후 취소 시 취소 수수료가 발생할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center pt-6 border-t" style={{ borderColor: '#E5E5E5' }}>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div 
        className="flex lg:hidden fixed inset-0 z-50 items-start justify-center px-3 py-4 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-sm rounded-xl p-3 shadow-2xl my-3"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 cursor-pointer z-10"
            style={{ color: '#666666' }}
          >
            <i className="ri-close-line text-lg"></i>
          </button>

          {/* Header */}
          <div className="text-center mb-2.5 pr-6">
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              예약 전 안내사항
            </h2>
            <p className="text-xs" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
              아래 내용을 꼭 확인해주세요
            </p>
          </div>

          {/* Wine Pairing Info */}
          <div className="mb-2.5">
            <h3 className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#CBB676' }}>
                <i className="ri-goblet-line text-xs" style={{ color: '#FFFFFF' }}></i>
              </div>
              와인 페어링 안내
            </h3>

            <div className="rounded-lg p-2.5 border" style={{ backgroundColor: '#FFF4E6', borderColor: '#CBB676' }}>
              <p className="text-xs leading-relaxed mb-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                와인을 즐기지 않으셔도 전혀 걱정하지 않으셔도 됩니다. 이번 오픈 기념 코스는 와인 없이 요리만으로도 충분히 제값, 그 이상을 하는 구성으로 준비했습니다.
              </p>
              <p className="text-xs leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                이번 코스 음식과 페어링 와인은 '추가 옵션'이라기보다, 저희가 오픈을 알리기 위해 홍보비를 보태 함께 준비한 작은 선물 같은 구성에 가깝습니다. 부담 없이 편안하게 코스 요리만 온전히 즐기셔도 좋고, 괜찮으시다면 곁들여 드리는 와인 한 잔 한 잔이 리오리오가 그리는 스페인의 저녁을 조금 더 또렷하게 보여줄 거예요.
              </p>
            </div>
          </div>

          {/* Time Schedule - Mobile */}
          <div className="mb-2.5">
            <h3 className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              <div className="w-5 h-5 flex items-center justify-center rounded" style={{ backgroundColor: '#0C2A23' }}>
                <i className="ri-time-line text-xs" style={{ color: '#CBB676' }}></i>
              </div>
              운영 시간
            </h3>
            <div className="rounded-lg p-2.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
              <p className="text-[10px] mb-2" style={{ color: '#666666' }}>서비스 80분 • 정리 10분</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Lunch */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <i className="ri-sun-line text-[10px]" style={{ color: '#CBB676' }}></i>
                    <span className="text-[10px] font-semibold" style={{ color: '#0C2A23' }}>런치</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>1부</span> <span style={{ color: '#0C2A23' }}>11:00~12:30</span></div>
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>2부</span> <span style={{ color: '#0C2A23' }}>12:30~14:00</span></div>
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>3부</span> <span style={{ color: '#0C2A23' }}>14:00~15:30</span></div>
                  </div>
                </div>
                {/* Dinner */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <i className="ri-moon-line text-[10px]" style={{ color: '#0C2A23' }}></i>
                    <span className="text-[10px] font-semibold" style={{ color: '#0C2A23' }}>디너</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>1부</span> <span style={{ color: '#0C2A23' }}>17:00~18:30</span></div>
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>2부</span> <span style={{ color: '#0C2A23' }}>18:30~20:00</span></div>
                    <div><span className="font-bold" style={{ color: '#CBB676' }}>3부</span> <span style={{ color: '#0C2A23' }}>20:00~21:30</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="mb-2.5">
            <h3 className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
              <div className="w-4 h-4 flex items-center justify-center rounded" style={{ backgroundColor: '#CBB676' }}>
                <i className="ri-information-line text-[10px]" style={{ color: '#FFFFFF' }}></i>
              </div>
              예약 안내
            </h3>
            <div className="space-y-1">
              <div className="rounded p-1.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <div className="flex items-start gap-1">
                  <i className="ri-user-line text-[10px] mt-0.5" style={{ color: '#CBB676' }}></i>
                  <div>
                    <p className="font-semibold text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      예약자 정보 정확히 기입
                    </p>
                    <p className="text-[9px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                      성함과 전화번호를 정확히 기입해주세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded p-1.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <div className="flex items-start gap-1">
                  <i className="ri-bank-card-line text-[10px] mt-0.5" style={{ color: '#CBB676' }}></i>
                  <div>
                    <p className="font-semibold text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      예약금 1인 10,000원
                    </p>
                    <p className="text-[9px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                      입금자명 = 예약자명 동일하게 입금
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded p-1.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <div className="flex items-start gap-1">
                  <i className="ri-group-line text-[10px] mt-0.5" style={{ color: '#CBB676' }}></i>
                  <div>
                    <p className="font-semibold text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      시간대별 5테이블 한정
                    </p>
                    <p className="text-[9px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                      예약 시간 엄수 부탁드립니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded p-1.5 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E5E5E5' }}>
                <div className="flex items-start gap-1">
                  <i className="ri-refresh-line text-[10px] mt-0.5" style={{ color: '#CBB676' }}></i>
                  <div>
                    <p className="font-semibold text-[10px]" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#0C2A23' }}>
                      취소 및 환불
                    </p>
                    <p className="text-[9px] leading-relaxed" style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', color: '#666666' }}>
                      5일 전까지 100% 환불, 이후 수수료 발생
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t" style={{ borderColor: '#E5E5E5' }}>
            <button
              onClick={handleConfirm}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif', backgroundColor: '#CBB676', color: '#FFFFFF' }}
            >
              확인했습니다
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
