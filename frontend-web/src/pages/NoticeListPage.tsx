import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBullhorn } from 'react-icons/fa';

interface Notice {
    noticeNo: number;
    title: string;
    content: string;
    pinYn: string;
    stdDate: string;
    endDate: string;
    insDtime: string;
}

export default function NoticeListPage() {
    const navigate = useNavigate();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchActiveNotices();
    }, []);

    const fetchActiveNotices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notices/active');
            if (res.ok) {
                const data = await res.json();
                setNotices(data || []);
            } else {
                // Fallback to admin active notices endpoint
                const fallbackRes = await fetch('/api/admin/notices/active');
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    setNotices(fallbackData || []);
                }
            }
        } catch (e) {
            console.error("Failed to fetch notices", e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

    return (
        <div className="min-h-screen bg-[#F7F9FC] font-['Pretendard'] pb-24 text-gray-900 selection:bg-[#00BDF8] selection:text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
                    aria-label="뒤로가기"
                >
                    <FaChevronLeft size={16} />
                </button>
                <h1 className="text-[17px] font-bold text-gray-900">공지사항</h1>
                <div className="w-9" />
            </div>

            {/* Content Body */}
            <div className="max-w-md mx-auto px-4 py-4 space-y-3">
                {loading ? (
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-xs animate-pulse space-y-2">
                                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                                <div className="h-3 bg-gray-100 rounded-md w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : notices.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs mt-4">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-300">
                            <FaBullhorn size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-600">진행 중인 공지사항이 없습니다.</p>
                        <p className="text-xs text-gray-400 mt-1">새로운 소식이 등록되면 알려드릴게요!</p>
                    </div>
                ) : (
                    notices.map((notice) => (
                        <div
                            key={notice.noticeNo}
                            onClick={() => navigate(`/main/notices/${notice.noticeNo}`)}
                            className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between gap-3"
                        >
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    {notice.pinYn === 'Y' && (
                                        <span className="bg-[#00BDF8]/10 text-[#00BDF8] text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                            중요
                                        </span>
                                    )}
                                    <h3 className="text-[14.5px] font-bold text-gray-900 truncate group-hover:text-[#00BDF8] transition-colors">
                                        {notice.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium">
                                    <span>{formatDate(notice.insDtime || notice.stdDate)}</span>
                                    {notice.stdDate && notice.endDate && (
                                        <>
                                            <span>·</span>
                                            <span>기간: {formatDate(notice.stdDate)} ~ {formatDate(notice.endDate)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <FaChevronRight size={12} className="text-gray-300 group-hover:text-[#00BDF8] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
