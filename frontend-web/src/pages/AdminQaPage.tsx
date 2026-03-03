import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaReply, FaCheck } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface QaItem {
    qaNo: number;
    userId: string;
    userNickNm: string;
    title: string;
    content: string;
    crdDate: string;
    hasAnswer: boolean;
}

const PAGE_SIZE = 20;

const AdminQaPage: React.FC = () => {
    const navigate = useNavigate();
    const [qas, setQas] = useState<QaItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'COMPLETED'>('ALL');

    const [selectedQa, setSelectedQa] = useState<QaItem | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isReplyOpen, setIsReplyOpen] = useState(false);

    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const fetchQas = useCallback(async (pageNum: number, currentFilter: string) => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/qa/admin/all?page=${pageNum}&size=${PAGE_SIZE}&filter=${currentFilter}`);
            if (res.ok) {
                const data = await res.json();
                setQas(prev => pageNum === 0 ? data : [...prev, ...data]);
                setHasMore(data.length === PAGE_SIZE);
            } else {
                showAlert('문의 목록을 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error(error);
            showAlert('서버 통신 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // 필터 변경 시 초기화
    useEffect(() => {
        setQas([]);
        setPage(0);
        setHasMore(true);
        fetchQas(0, filter);
    }, [filter]);

    // 페이지 변경 시 로드
    useEffect(() => {
        if (page > 0) {
            fetchQas(page, filter);
        }
    }, [page]);

    // 무한 스크롤 관찰자
    useEffect(() => {
        if (!bottomRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.5 });
        observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const showAlert = (message: string) => {
        setAlertModal({ isOpen: true, message });
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim() || !selectedQa) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const res = await fetch('/api/qa/admin/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: `RE: ${selectedQa.title}`,
                    content: replyContent,
                    parentQaNo: selectedQa.qaNo
                })
            });

            if (res.ok) {
                showAlert('답변이 등록되었습니다.');
                setIsReplyOpen(false);
                setReplyContent('');
                // 해당 항목만 상태 업데이트하거나 전체 재조회
                setQas(prev => prev.map(item =>
                    item.qaNo === selectedQa.qaNo ? { ...item, hasAnswer: true } : item
                ));
            } else {
                showAlert('답변 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            showAlert('서버 통신 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-3">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-[14px] text-[#003C48] font-bold">고객센터 관리</h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white border-b border-gray-100">
                {(['ALL', 'WAITING', 'COMPLETED'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors relative ${filter === f ? 'text-[#00BDF8]' : 'text-gray-400'}`}
                    >
                        {f === 'ALL' ? '전체' : f === 'WAITING' ? '답변대기' : '답변완료'}
                        {filter === f && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00BDF8]"></div>}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {qas.length > 0 ? (
                    qas.map(qa => (
                        <div
                            key={qa.qaNo}
                            onClick={() => {
                                setSelectedQa(qa);
                                setIsReplyOpen(true);
                            }}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[#00BDF8]/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${qa.hasAnswer ? 'bg-[#00BDF8] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {qa.hasAnswer ? '답변완료' : '답변대기'}
                                </span>
                                <span className="text-[11px] text-gray-400">{formatDate(qa.crdDate)}</span>
                            </div>
                            <h3 className="text-[14px] text-[#003C48] font-bold mb-1 truncate">{qa.title}</h3>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                                <span className="text-[#00BDF8] font-bold">{qa.userNickNm}</span>
                                <span>|</span>
                                <span className="line-clamp-1 text-[13px]">{qa.content}</span>
                            </div>
                        </div>
                    ))
                ) : !loading && (
                    <div className="text-center py-10 text-gray-400 text-[13px]">조회된 문의 내역이 없습니다.</div>
                )}

                {loading && (
                    <div className="text-center py-4 text-gray-400 text-[12px]">불러오는 중...</div>
                )}
                {hasMore && <div ref={bottomRef} className="h-4" />}
            </div>

            {/* Reply Modal */}
            {isReplyOpen && selectedQa && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-[14px] font-bold text-[#003C48]">문의 상세 및 답변</h2>
                            <button onClick={() => setIsReplyOpen(false)} className="text-gray-400">
                                <FaChevronLeft className="rotate-90" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <div className="text-[11px] text-[#00BDF8] font-bold mb-1">{selectedQa.userNickNm} 님의 문의</div>
                                <div className="text-[14px] text-[#003C48] font-bold mb-2">{selectedQa.title}</div>
                                <div className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedQa.content}</div>
                            </div>

                            {!selectedQa.hasAnswer ? (
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-400 mb-2 ml-1">답변 작성</label>
                                    <textarea
                                        className="w-full bg-[#f4f6f8] border border-gray-200 rounded-2xl p-4 text-[13px] focus:outline-none focus:border-[#00BDF8] h-40 resize-none transition-colors"
                                        placeholder="답변 내용을 입력하세요"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                                    <div className="text-[11px] text-blue-500 font-bold mb-1">이미 답변이 등록된 문의입니다.</div>
                                    <p className="text-[12px] text-gray-400 italic">상세 답변 내역은 사용자 페이지에서 확인 가능합니다.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-5 pt-0">
                            {!selectedQa.hasAnswer ? (
                                <button
                                    onClick={handleReplySubmit}
                                    className="w-full py-3.5 bg-[#00BDF8] text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-[#00BDF8]/20 hover:bg-[#009bc9] transition-all flex items-center justify-center gap-2"
                                >
                                    <FaReply /> 답변 등록하기
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsReplyOpen(false)}
                                    className="w-full py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2"
                                >
                                    <FaCheck /> 확인 완료
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <CommonModal
                isOpen={alertModal.isOpen}
                type="alert"
                message={alertModal.message}
                onConfirm={() => setAlertModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default AdminQaPage;
