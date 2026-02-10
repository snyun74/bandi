import React, { useEffect, useState } from 'react';
import { FaTimes, FaChevronLeft, FaClock } from 'react-icons/fa';
import CommonModal from './common/CommonModal';

interface VoteParticipatingModalProps {
    voteId: number;
    onClose: () => void;
}

interface VoteDetail {
    cnVoteNo: number;
    title: string;
    description: string;
    endTime: string;
    allowMultiple: boolean;
    isAnonymous: boolean;
    questions: {
        cnVoteQuestionNo: number;
        questionText: string;
        questionType: string;
        items: {
            cnVoteItemNo: number;
            itemText: string;
            itemOrder: number;
        }[];
    }[];
    insId: string;
}

const VoteParticipatingModal: React.FC<VoteParticipatingModalProps> = ({ voteId, onClose }) => {
    const [voteDetail, setVoteDetail] = useState<VoteDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchVoteDetail = async () => {
            try {
                const response = await fetch(`/api/vote/${voteId}`);
                if (response.ok) {
                    const data = await response.json();
                    setVoteDetail(data);
                } else {
                    console.error("Failed to fetch vote detail");
                    setAlertMessage("투표 정보를 불러오는데 실패했습니다.");
                    setIsAlertOpen(true);
                }
            } catch (error) {
                console.error("Error fetching vote detail:", error);
                setAlertMessage("오류가 발생했습니다.");
                setIsAlertOpen(true);
            } finally {
                setLoading(false);
            }
        };

        if (voteId) {
            fetchVoteDetail();
        }
    }, [voteId]);

    const handleItemClick = (itemNo: number, allowMultiple: boolean) => {
        if (allowMultiple) {
            if (selectedItems.includes(itemNo)) {
                setSelectedItems(selectedItems.filter(id => id !== itemNo));
            } else {
                setSelectedItems([...selectedItems, itemNo]);
            }
        } else {
            setSelectedItems([itemNo]);
        }
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setAlertMessage("투표할 항목을 선택해주세요.");
            setIsAlertOpen(true);
            return;
        }

        // TODO: Implement actual vote submission logic here
        // For now, just show success message and close
        setAlertMessage("투표가 완료되었습니다. (기능 구현 중)");
        setIsAlertOpen(true);
        // After alert confirmation, we might want to close the modal, 
        // but CommonModal onConfirm just closes the alert.
        // We'll handle closing this modal separately or add logic to CommonModal (not possible easily without changing it).
        // For now, let's just close this modal after a short delay or let user acknowledge.
    };

    const calculateTimeRemaining = (endTimeStr: string) => {
        if (!endTimeStr || endTimeStr.length !== 14) return "";

        const year = parseInt(endTimeStr.substring(0, 4));
        const month = parseInt(endTimeStr.substring(4, 6)) - 1;
        const day = parseInt(endTimeStr.substring(6, 8));
        const hour = parseInt(endTimeStr.substring(8, 10));
        const minute = parseInt(endTimeStr.substring(10, 12));
        const second = parseInt(endTimeStr.substring(12, 14));

        const end = new Date(year, month, day, hour, minute, second);
        const now = new Date();
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return "투표 종료";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}일 ${hours}시간 ${minutes}분`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white p-4 rounded-xl">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="bg-white w-full max-w-sm rounded-[20px] shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                    {/* <h2 className="text-lg font-bold text-[#003C48] flex-1 text-center mr-8">투표</h2> */}
                </div>

                {/* Content */}
                {voteDetail ? (
                    <div className="p-6 flex-1 overflow-y-auto">

                        <h2 className="text-2xl font-bold text-[#003C48] text-center mb-1">{voteDetail.title}</h2>
                        {/* <p className="text-center text-gray-500 text-sm mb-6">{voteDetail.description}</p> */}

                        <div className="flex justify-end mb-4">
                            <button className="text-gray-500 text-xs underline decoration-gray-400 underline-offset-2">현황 보기</button>
                        </div>

                        <div className="space-y-3 mb-8">
                            {voteDetail.questions[0].items.map((item) => {
                                const isSelected = selectedItems.includes(item.cnVoteItemNo);
                                const isMultiple = voteDetail.questions[0].questionType === 'MULT';
                                return (
                                    <div
                                        key={item.cnVoteItemNo}
                                        onClick={() => handleItemClick(item.cnVoteItemNo, isMultiple)}
                                        className={`
                                            relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
                                            ${isSelected
                                                ? 'bg-[#00BDF8] border-[#00BDF8] text-white shadow-md transform scale-[1.01]'
                                                : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                                            }
                                        `}
                                    >
                                        <div className="font-bold text-lg">
                                            {item.itemOrder}. {item.itemText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-center mb-6">
                            <button
                                onClick={handleSubmit}
                                className="bg-[#00BDF8] text-white px-10 py-2.5 rounded-full text-lg font-bold shadow-md hover:bg-[#009bc9] transition-transform active:scale-[0.98]"
                            >
                                투표하기
                            </button>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between text-[#003C48] font-bold mb-2">
                                <span>투표 종료까지 남은 시간</span>
                                <div className="flex items-center text-[#003C48]">
                                    <FaClock className="mr-1.5" />
                                    <span>{calculateTimeRemaining(voteDetail.endTime)}</span>
                                </div>
                            </div>
                            <div className="text-xs text-[#003C48] space-y-1">
                                <p>* {voteDetail.allowMultiple ? '복수 선택 가능' : '복수 선택 불가능'}</p>
                                <p>* {voteDetail.isAnonymous ? '익명' : '기명'}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <input
                                type="text"
                                placeholder="댓글"
                                className="w-full border border-[#003C48] rounded-[15px] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003C48]"
                            />
                        </div>

                    </div>
                ) : (
                    <div className="p-6 flex-1 flex flex-col items-center justify-center text-gray-500">
                        <p>투표 정보를 불러올 수 없습니다.</p>
                    </div>
                )}

                <CommonModal
                    isOpen={isAlertOpen}
                    type="alert"
                    message={alertMessage}
                    onConfirm={() => {
                        setIsAlertOpen(false);
                        if (!voteDetail) onClose(); // Close modal if used on error
                    }}
                />

            </div>
        </div>
    );
};

export default VoteParticipatingModal;
