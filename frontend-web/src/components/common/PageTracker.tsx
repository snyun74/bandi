import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../firebase/firebaseConfig';

/**
 * 페이지 이동을 감지하여 Firebase Analytics에 기록하는 컴포넌트
 */
const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (analytics) {
            logEvent(analytics, 'page_view', {
                page_path: location.pathname,
                page_location: window.location.href,
                page_title: document.title,
            });
        }
    }, [location]);

    return null;
};

export default PageTracker;
