import React, { useEffect, useState } from 'react';

interface VersionInfo {
  latestVersionCode: number;
  latestVersionName: string;
  forceUpdate: boolean;
  storeUrl?: string;
  iosStoreUrl?: string;
}

const DISMISS_KEY = 'dismiss_app_update_timestamp';

const AppUpdateModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/api/common/app-version');
        if (!response.ok) return;

        const data: VersionInfo = await response.json();
        setVersionInfo(data);

        // 1. 앱 환경 확인 (ReactNativeWebView, WebView UserAgent, 브릿지 함수 등)
        const isReactNative = !!(window as any).ReactNativeWebView;
        const isAndroidWebView = /Android.*(wv|Version\/[0-9.]+)/i.test(navigator.userAgent);
        const isAppBridge = !!(window as any).__pendingFcmToken || !!(window as any).receiveNativeMessage;
        const isNativeApp = isReactNative || isAndroidWebView || isAppBridge;

        // 2. 현재 설치된 앱의 버전 코드 확인
        // (3.7부터는 window.__appVersionCode = 23 주입됨. 3.6 이하는 주입되지 않아 undefined -> 22)
        const currentAppVersionCode = (window as any).__appVersionCode ?? 22;

        // 네이티브 앱 환경에서 최신 버전보다 낮은 경우 팝업 노출
        if (isNativeApp && currentAppVersionCode < data.latestVersionCode) {
          if (!data.forceUpdate) {
            const dismissedTime = localStorage.getItem(DISMISS_KEY);
            if (dismissedTime) {
              const diffHours = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60);
              if (diffHours < 24) {
                return; // 24시간 동안 노출 방지
              }
            }
          }
          setShowModal(true);
        }
      } catch (e) {
        console.warn('Web app version check error:', e);
      }
    };

    // FCM 브릿지 등이 로드될 수 있도록 약간의 지연 후 체크
    const timer = setTimeout(checkVersion, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!showModal || !versionInfo) return null;

  const handleUpdate = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      const iosUrl = versionInfo.iosStoreUrl || 'https://apps.apple.com/app/id6475653554';
      window.location.href = iosUrl;
    } else {
      const androidStoreUrl = versionInfo.storeUrl || 'market://details?id=com.bandimobile';
      // market:// 스킴 시도 후 웹 스토어로 fallback
      try {
        window.location.href = androidStoreUrl;
      } catch {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.bandimobile';
      }
    }
  };

  const handleClose = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 scale-100 p-6 text-center animate-fade-in">
        {/* 아이콘 */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-sky-50 text-[#00BDF8] mb-4">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          새로운 버전 ({versionInfo.latestVersionName}) 출시!
        </h3>
        <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
          더 나은 서비스와 안정적인 사용을 위해<br />
          최신 버전으로 업데이트해 주세요.
        </p>

        <div className={`grid ${versionInfo.forceUpdate ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          {!versionInfo.forceUpdate && (
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors duration-200"
            >
              오늘 하루 닫기
            </button>
          )}
          <button
            onClick={handleUpdate}
            className="w-full py-3 px-4 bg-[#00BDF8] hover:bg-[#00a8dc] text-white rounded-xl font-bold transition-colors duration-200 shadow-lg shadow-sky-200"
          >
            업데이트 하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppUpdateModal;
