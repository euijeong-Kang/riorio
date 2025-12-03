import { useEffect } from 'react';

// GTM DataLayer 타입 정의
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// GTM 이벤트 전송 함수
export const pushToDataLayer = (event: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
    });
  }
};

export const useGTMTracking = () => {
  useEffect(() => {
    // 스크롤 깊이 추적
    let scrollDepths = [25, 50, 75, 100];
    let triggeredDepths: number[] = [];

    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      scrollDepths.forEach((depth) => {
        if (scrollPercentage >= depth && !triggeredDepths.includes(depth)) {
          triggeredDepths.push(depth);
          pushToDataLayer('scroll_depth', {
            scroll_depth: depth,
            page_path: window.location.pathname,
          });
        }
      });
    };

    // 외부 링크 클릭 추적
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const isExternal = link.hostname !== window.location.hostname;
        
        if (isExternal) {
          pushToDataLayer('outbound_link_click', {
            link_url: link.href,
            link_text: link.textContent?.trim() || '',
            link_domain: link.hostname,
          });
        }
      }
    };

    // 섹션 가시성 추적 (Intersection Observer)
    const observeSections = () => {
      const sections = document.querySelectorAll('[data-section]');
      const observedSections = new Set<string>();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const sectionName = entry.target.getAttribute('data-section');
              
              if (sectionName && !observedSections.has(sectionName)) {
                observedSections.add(sectionName);
                pushToDataLayer('section_view', {
                  section_name: sectionName,
                  page_path: window.location.pathname,
                });
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      sections.forEach((section) => observer.observe(section));

      return () => observer.disconnect();
    };

    // 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleLinkClick);
    const cleanupObserver = observeSections();

    // 페이지 로드 시간 추적
    if (window.performance && window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      
      if (loadTime > 0) {
        pushToDataLayer('page_load_time', {
          load_time_ms: loadTime,
          page_path: window.location.pathname,
        });
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleLinkClick);
      cleanupObserver();
    };
  }, []);

  // 예약 버튼 클릭 추적
  const trackReservationClick = (source: string = 'unknown', buttonText?: string) => {
    pushToDataLayer('reservation_click', {
      event_category: 'Conversion',
      event_label: source,
      button_text: buttonText,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  };

  // 공유 버튼 클릭 추적
  const trackShareClick = (platform: string) => {
    pushToDataLayer('share_click', {
      event_category: 'Social Share',
      event_label: platform,
      share_platform: platform,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  };

  // 전화번호 클릭 추적
  const trackPhoneClick = (phoneNumber: string, source?: string) => {
    pushToDataLayer('phone_click', {
      event_category: 'Contact',
      event_label: 'Phone Call',
      phone_number: phoneNumber,
      click_source: source,
      page_path: window.location.pathname,
    });
  };

  // 지도 클릭 추적
  const trackMapClick = (mapType: string = 'naver') => {
    pushToDataLayer('map_click', {
      event_category: 'Navigation',
      event_label: 'Map View',
      map_type: mapType,
      page_path: window.location.pathname,
    });
  };

  // 코스 상세보기 클릭 추적
  const trackCourseDetailClick = (courseName?: string) => {
    pushToDataLayer('course_detail_click', {
      event_category: 'Engagement',
      event_label: 'Course Detail View',
      course_name: courseName,
      page_path: window.location.pathname,
    });
  };

  // 폼 제출 추적
  const trackFormSubmit = (formName: string, formData?: Record<string, any>) => {
    pushToDataLayer('form_submit', {
      event_category: 'Form',
      event_label: formName,
      form_name: formName,
      ...formData,
      page_path: window.location.pathname,
    });
  };

  // 폼 시작 추적 (첫 입력 시)
  const trackFormStart = (formName: string) => {
    pushToDataLayer('form_start', {
      event_category: 'Form',
      event_label: formName,
      form_name: formName,
      page_path: window.location.pathname,
    });
  };

  // 에러 추적
  const trackError = (errorType: string, errorMessage: string) => {
    pushToDataLayer('error', {
      event_category: 'Error',
      event_label: errorType,
      error_message: errorMessage,
      page_path: window.location.pathname,
    });
  };

  // 사용자 참여도 추적 (체류 시간)
  const trackEngagementTime = (timeInSeconds: number) => {
    pushToDataLayer('engagement_time', {
      event_category: 'Engagement',
      engagement_time_seconds: timeInSeconds,
      page_path: window.location.pathname,
    });
  };

  return {
    trackReservationClick,
    trackShareClick,
    trackPhoneClick,
    trackMapClick,
    trackCourseDetailClick,
    trackFormSubmit,
    trackFormStart,
    trackError,
    trackEngagementTime,
  };
};
