import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface QaItem {
    qaNo: number;
    title: string;
    content: string;
    crdDate: string;
    hasAnswer: boolean;
    userNickNm: string;
}

interface QaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    qa: QaItem | null;
    answers: QaItem[];
}

const QaDetailModal: React.FC<QaDetailModalProps> = ({ isOpen, onClose, qa, answers }) => {
    if (!isOpen || !qa) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ fontFamily: '"Jua", sans-serif', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-[#F5F6F8] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0 rounded-t-3xl">
                    <h2 className="text-xl font-bold text-[#003C48]">상담 상세</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Question Box */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">나의 문의</span>
                            <span className="text-xs text-gray-400">{qa.crdDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#003C48] mb-2">{qa.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{qa.content}</p>
                    </div>

                    {/* Answers Box */}
                    {answers && answers.length > 0 ? (
                        <div className="space-y-4">
                            {answers.map((ans) => (
                                <div key={ans.qaNo} className="bg-indigo-50 rounded-2xl p-5 shadow-sm border border-indigo-100 relative">
                                    <div className="flex items-center gap-2 mb-3 border-b border-indigo-100/50 pb-3">
                                        <span className="text-[11px] font-bold text-white bg-[#00BDF8] px-2 py-0.5 rounded-full">고객센터 답변</span>
                                        <span className="text-xs text-indigo-400">{ans.crdDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}</span>
                                    </div>
                                    <p className="text-sm text-[#003C48] leading-relaxed whitespace-pre-wrap">{ans.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-sm text-gray-400">아직 등록된 답변이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex-shrink-0 rounded-b-3xl text-center">
                    <button onClick={onClose} className="w-full bg-[#00BDF8] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#009bc9] transition-colors shadow-sm">
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QaDetailModal;
