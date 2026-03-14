import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { linkifyText } from '../../utils/textUtils';

interface Notice {
    noticeNo: number;
    title: string;
    content: string;
}

interface NoticePopupProps {
    notices: Notice[];
    onClose: () => void;
}

const NoticePopup: React.FC<NoticePopupProps> = ({ notices, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dontShowToday, setDontShowToday] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Find notices that shouldn't be shown again
        const filteredNotices = notices.filter(notice => {
            const isHidden = localStorage.getItem(`hide_notice_${notice.noticeNo}`);
            return isHidden !== 'permanent';
        });

        if (filteredNotices.length > 0) {
            setIsVisible(true);
        } else {
            onClose();
        }
    }, [notices, onClose]);

    const handleClose = () => {
        if (dontShowToday) {
            const currentNotice = notices[currentIndex];
            localStorage.setItem(`hide_notice_${currentNotice.noticeNo}`, 'permanent');
        }

        if (currentIndex < notices.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setDontShowToday(false);
        } else {
            setIsVisible(false);
            onClose();
        }
    };

    if (!isVisible || notices.length === 0) return null;

    const currentNotice = notices[currentIndex];

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Notice Header */}
                <div className="bg-[#003C48] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-[15px] font-bold">공지사항</h2>
                    <span className="text-white/60 text-[11px] font-medium">{currentIndex + 1} / {notices.length}</span>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[400px]">
                    <h3 className="text-[#00BDF8] text-[16px] font-bold mb-4 break-keep">{currentNotice.title}</h3>
                    <div className="text-gray-600 text-[13px] leading-relaxed whitespace-pre-wrap break-keep">
                        {linkifyText(currentNotice.content)}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button 
                        onClick={() => setDontShowToday(!dontShowToday)}
                        className="flex items-center gap-2 group"
                    >
                        {dontShowToday ? (
                            <FaCheckSquare className="text-[#00BDF8] text-[18px]" />
                        ) : (
                            <FaSquare className="text-gray-300 text-[18px] group-hover:text-gray-400" />
                        )}
                        <span className="text-gray-500 text-[12px] font-medium">다시 보지 않기</span>
                    </button>
                    
                    <button 
                        onClick={handleClose}
                        className="bg-[#00BDF8] text-white px-5 py-2 rounded-xl text-[13px] font-bold shadow-sm shadow-[#00BDF8]/20 active:scale-95 transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticePopup;
