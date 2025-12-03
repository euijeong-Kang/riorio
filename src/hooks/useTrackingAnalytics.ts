import { useEffect } from 'react';

interface TrackingParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
}

export const useTrackingAnalytics = () => {
  useEffect(() => {
    const trackPageView = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = document.referrer;
      
      // UTM 파라미터 추출
      const trackingParams: TrackingParams = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        utm_content: urlParams.get('utm_content') || undefined,
        utm_term: urlParams.get('utm_term') || undefined,
        ref: urlParams.get('ref') || undefined,
      };

      // 트래픽 소스 분류
      let trafficSource = 'direct';
      let trafficMedium = 'none';

      if (trackingParams.utm_source) {
        trafficSource = trackingParams.utm_source;
        trafficMedium = trackingParams.utm_medium || 'utm';
      } else if (trackingParams.ref) {
        trafficSource = trackingParams.ref;
        trafficMedium = 'referral';
      } else if (referrer) {
        if (referrer.includes('kakao')) {
          trafficSource = 'kakaotalk';
          trafficMedium = 'social';
        } else if (referrer.includes('instagram')) {
          trafficSource = 'instagram';
          trafficMedium = 'social';
        } else if (referrer.includes('facebook')) {
          trafficSource = 'facebook';
          trafficMedium = 'social';
        } else if (referrer.includes('google')) {
          trafficSource = 'google';
          trafficMedium = 'organic';
        } else if (referrer.includes('naver')) {
          trafficSource = 'naver';
          trafficMedium = 'organic';
        } else {
          trafficSource = 'referral';
          trafficMedium = 'referral';
        }
      }

      // GA4 이벤트 전송
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          traffic_source: trafficSource,
          traffic_medium: trafficMedium,
          utm_source: trackingParams.utm_source,
          utm_medium: trackingParams.utm_medium,
          utm_campaign: trackingParams.utm_campaign,
          utm_content: trackingParams.utm_content,
          utm_term: trackingParams.utm_term,
          custom_ref: trackingParams.ref,
        });

        // 커스텀 이벤트로 트래픽 소스별 추적
        gtag('event', 'traffic_source_tracking', {
          event_category: 'Traffic Source',
          event_label: trafficSource,
          traffic_medium: trafficMedium,
          is_qr_code: trackingParams.utm_source === 'qr_code' || trackingParams.ref === 'qr',
          is_share: trackingParams.utm_source === 'share' || trafficMedium === 'social',
          is_direct: trafficSource === 'direct',
        });
      }

      // 로컬 스토리지에 트래픽 정보 저장 (세션 추적용)
      const sessionData = {
        trafficSource,
        trafficMedium,
        utmParams: trackingParams,
        timestamp: new Date().toISOString(),
        referrer: referrer || 'direct',
      };

      localStorage.setItem('riorio_traffic_source', JSON.stringify(sessionData));

      // 콘솔에 트래킹 정보 출력 (개발용)
      console.log('🔍 Traffic Tracking:', {
        source: trafficSource,
        medium: trafficMedium,
        utm: trackingParams,
        referrer,
      });
    };

    // 페이지 로드 시 트래킹
    trackPageView();
  }, []);

  // 공유 이벤트 트래킹 함수
  const trackShareEvent = (platform: string) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        event_category: 'Social Share',
        event_label: platform,
        content_type: 'restaurant_special_offer',
        item_id: 'riorio_grand_opening',
      });
    }
  };

  // 예약 버튼 클릭 트래킹 함수
  const trackReservationClick = (source: string = 'unknown') => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'reservation_click', {
        event_category: 'Conversion',
        event_label: source,
        value: 1,
      });
    }
  };

  return {
    trackShareEvent,
    trackReservationClick,
  };
};

// 전역 gtag 타입 선언
declare global {
  function gtag(...args: any[]): void;
}