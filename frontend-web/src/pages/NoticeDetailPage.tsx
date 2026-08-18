import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaBullhorn, FaCalendarAlt } from 'react-icons/fa';

interface Notice {
    noticeNo: number;
    title: string;
    content: string;
    pinYn: string;
    stdDate: string;
    endDate: string;
    insDtime: string;
    writerUserId?: string;
}

export default function NoticeDetailPage() {
    const navigate = useNavigate();
    const { noticeNo } = useParams<{ noticeNo: string }>();
    const [notice, setNotice] = useState<Notice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (noticeNo) {
            fetchNoticeDetail();
        }
    }, [noticeNo]);

    const fetchNoticeDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notices/${noticeNo}`);
            if (res.ok) {
                const data = await res.json();
                setNotice(data);
            } else {
                const fallbackRes = await fetch(`/api/admin/notices/${noticeNo}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    setNotice(fallbackData);
                }
            }
        } catch (e) {
            console.error("Failed to fetch notice detail", e);
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

            {/* Content Area */}
            <div className="max-w-md mx-auto px-4 py-4">
                {loading ? (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded-md w-3/4" />
                        <div className="h-4 bg-gray-100 rounded-md w-1/2" />
                        <div className="h-40 bg-gray-50 rounded-xl" />
                    </div>
                ) : !notice ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs mt-4">
                        <p className="text-sm font-bold text-gray-600">공지사항을 찾을 수 없습니다.</p>
                        <button
                            onClick={() => navigate('/main/notices')}
                            className="mt-4 px-4 py-2 bg-[#00BDF8] text-white rounded-full text-xs font-bold"
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
                        {/* Notice Header */}
                        <div className="space-y-2.5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    notice.pinYn === 'Y'
                                        ? 'bg-[#00BDF8]/10 text-[#00BDF8]'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {notice.pinYn === 'Y' ? '중요 공지' : '공지'}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    {formatDate(notice.insDtime || notice.stdDate)}
                                </span>
                            </div>

                            <h2 className="text-[17px] font-bold text-gray-900 leading-snug">
                                {notice.title}
                            </h2>

                            {notice.stdDate && notice.endDate && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-xl inline-flex">
                                    <FaCalendarAlt size={11} className="text-[#00BDF8]" />
                                    <span>공지 기간: {formatDate(notice.stdDate)} ~ {formatDate(notice.endDate)}</span>
                                </div>
                            )}
                        </div>

                        {/* Notice Body */}
                        <div className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[140px] font-normal py-1">
                            {notice.content}
                        </div>

                        {/* Back to list button */}
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => navigate('/main/notices')}
                                className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-[0.99] text-gray-700 font-bold text-[14px] transition-all text-center"
                            >
                                공지사항 목록으로
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
