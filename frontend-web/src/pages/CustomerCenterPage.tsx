import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import QaDetailModal from '../components/common/QaDetailModal';

interface QaItem {
    qaNo: number;
    title: string;
    content: string;
    crdDate: string;
    hasAnswer: boolean;
    userNickNm: string;
}

const CustomerCenterPage: React.FC = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [inquiries, setInquiries] = useState<QaItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Alert Modal State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedQa, setSelectedQa] = useState<QaItem | null>(null);
    const [qaAnswers, setQaAnswers] = useState<QaItem[]>([]);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchInquiries();
    }, [userId]);

    const fetchInquiries = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/qa/user/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setInquiries(data);
            }
        } catch (error) {
            console.error("Failed to fetch inquiries", error);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            showAlert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (!userId) return;

        setLoading(true);
        try {
            const res = await fetch('/api/qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    title,
                    content
                })
            });

            if (res.ok) {
                showAlert('문의가 접수되었습니다.');
                setTitle('');
                setContent('');
                fetchInquiries();
            } else {
                showAlert('문의 접수에 실패했습니다.');
            }
        } catch (error) {
            console.error("Submit error", error);
            showAlert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleQaClick = async (qa: QaItem) => {
        setSelectedQa(qa);

        if (qa.hasAnswer) {
            try {
                const res = await fetch(`/api/qa/${qa.qaNo}/answers`);
                if (res.ok) {
                    const data = await res.json();
                    setQaAnswers(data);
                } else {
                    setQaAnswers([]);
                }
            } catch (error) {
                console.error("Failed to fetch answers", error);
                setQaAnswers([]);
            }
        } else {
            setQaAnswers([]);
        }

        setIsDetailOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3 sticky top-0 bg-white z-10">
                <button onClick={() => navigate(-1)} className="text-gray-500 mr-2">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold pb-1">고객센터</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 px-6 py-6">

                {/* Inquiry Form */}
                <div className="mb-6">
                    <h2 className="text-xl text-[#003C48] font-bold mb-4">문의사항 작성하기</h2>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="제목을 입력하세요."
                            className="w-full bg-[#F5F6F8] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-[#003C48] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] transition-colors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="내용을 입력하세요."
                            className="w-full bg-[#F5F6F8] border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-[#003C48] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] transition-colors resize-none h-32"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[#00BDF8] text-white text-lg font-bold px-12 py-3 rounded-2xl shadow-sm hover:bg-[#009bc9] transition-colors w-1/2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '전송중...' : '전송하기'}
                        </button>
                    </div>
                </div>

                {/* History Header */}
                <div className="flex items-center gap-2 mb-4 mt-10">
                    <h2 className="text-xl text-[#003C48] font-bold">내 상담 내역</h2>
                    <span className="text-xs text-gray-400 font-sans mt-0.5">(최근 1개월 기준)</span>
                </div>

                {/* History Area */}
                <div className="mb-8 mt-4 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {inquiries.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {inquiries.map((item) => (
                                <div
                                    key={item.qaNo}
                                    className="bg-white p-5 flex flex-col gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => handleQaClick(item)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {item.hasAnswer ? (
                                                <span className="shrink-0 text-[10px] font-bold text-white bg-[#00BDF8] px-2 py-0.5 rounded-full whitespace-nowrap">답변완료</span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">답변대기</span>
                                            )}
                                            <span className="text-[#003C48] font-bold text-[15px]">
                                                {item.title.length > 14 ? item.title.slice(0, 14) + '...' : item.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-[#8A9DB0] font-sans whitespace-nowrap pt-1">
                                            {item.crdDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400 text-sm bg-white">
                            최근 1개월 내 상담 내역이 없습니다.
                        </div>
                    )}
                </div>

            </div>

            {/* Alert Modal */}
            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertOpen(false)}
            />

            {/* QA Detail Modal */}
            <QaDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                qa={selectedQa}
                answers={qaAnswers}
            />
        </div>
    );
};

export default CustomerCenterPage;
