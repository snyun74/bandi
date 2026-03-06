import React, { useEffect, useState } from 'react';

interface PushToastProps {
    title: string;
    body: string;
    link?: string;
    logNo?: string;
    onClose: () => void;
}

const PushToast: React.FC<PushToastProps> = ({ title, body, link, logNo, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Slide in animation
        const timer = setTimeout(() => setIsVisible(true), 100);

        // Auto close after 5 seconds
        const closeTimer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(closeTimer);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for slide out animation
    };

    const handleAction = async () => {
        // 읽음 처리 API 호출
        if (logNo) {
            try {
                fetch(`/api/push/read/${logNo}`, { method: 'POST' });
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }

        if (link) {
            window.location.href = link;
        }
        handleClose();
    };

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[90%] max-w-sm transition-all duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
                }`}
        >
            <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-4 flex items-start gap-4 ring-1 ring-black/5">
                {/* Icon Container */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#00BDF8] to-[#008BB8] flex items-center justify-center shadow-lg shadow-[#00BDF8]/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0" onClick={handleAction}>
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                        {title || '반디 알림'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {body}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Click Feedback Overlay (Desktop only hint) */}
            {link && (
                <div className="absolute inset-0 cursor-pointer pointer-events-none rounded-2xl ring-2 ring-transparent active:ring-[#00BDF8]/30 transition-all"></div>
            )}
        </div>
    );
};

export default PushToast;
