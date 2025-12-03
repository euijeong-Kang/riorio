import { useEffect } from 'react';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function NotificationToast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000 
}: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#0C2A23';
      case 'error':
        return '#DC2626';
      case 'info':
        return '#2563EB';
      default:
        return '#0C2A23';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'ri-checkbox-circle-line';
      case 'error':
        return 'ri-error-warning-line';
      case 'info':
        return 'ri-information-line';
      default:
        return 'ri-checkbox-circle-line';
    }
  };

  return (
    <>
      <div 
        className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-50 animate-fade-in max-w-md w-full mx-4"
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <div className="flex items-center gap-3">
          <i className={`${getIcon()} text-xl text-white flex-shrink-0`}></i>
          <p 
            className="text-sm font-medium flex-1" 
            style={{ 
              fontFamily: 'Pretendard Variable, Pretendard, Noto Sans KR, sans-serif',
              color: '#FFFFFF'
            }}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <i className="ri-close-line text-white text-sm"></i>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

