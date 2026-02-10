import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaClock } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

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
    hasVoted?: boolean;
    myVoteItemIds?: number[];
}

const VoteDetail: React.FC = () => {
    const { voteId } = useParams<{ voteId: string }>();
    const navigate = useNavigate();
    const [voteDetail, setVoteDetail] = useState<VoteDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchVoteDetail = async () => {
            if (!voteId) return;
            const userId = localStorage.getItem('userId');
            try {
                // Determine URL based on userId presence
                const url = userId
                    ? `/api/vote/${voteId}?userId=${userId}`
                    : `/api/vote/${voteId}`;

                const response = await fetch(url);
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

        fetchVoteDetail();
    }, [voteId]);

    // Helper calculation
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

    const isVoteEnded = voteDetail ? calculateTimeRemaining(voteDetail.endTime) === "투표 종료" : false;
    // Button is disabled ONLY if vote ended. If voted, it's enabled but shows "Cancel".
    const isButtonDisabled = isVoteEnded;

    useEffect(() => {
        if (voteDetail?.hasVoted && voteDetail.myVoteItemIds) {
            // Using type assertion since backend returns Long (number) but frontend treats as number
            setSelectedItems(voteDetail.myVoteItemIds.map(id => Number(id)));
        }
    }, [voteDetail]);

    const handleItemClick = (itemNo: number, allowMultiple: boolean) => {
        if (isVoteEnded) return;
        if (voteDetail?.hasVoted) return; // Cannot change selection while in "Voted" state, must cancel first

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

    const handleCancelVote = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch('/api/vote/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voteId: Number(voteId),
                    userId: userId
                })
            });

            if (response.ok) {
                setAlertMessage("투표가 취소되었습니다.");
                setIsAlertOpen(true);
                // Refresh vote detail
                const url = `/api/vote/${voteId}?userId=${userId}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setVoteDetail(data);
                    setSelectedItems([]); // Clear selection after cancel
                }
            } else {
                const errorMsg = await response.text();
                setAlertMessage(errorMsg || "투표 취소에 실패했습니다.");
                setIsAlertOpen(true);
            }
        } catch (error) {
            console.error("Error canceling vote:", error);
            setAlertMessage("오류가 발생했습니다.");
            setIsAlertOpen(true);
        }
    };

    const handleSubmit = async () => {
        if (voteDetail?.hasVoted) {
            handleCancelVote();
            return;
        }

        if (selectedItems.length === 0) {
            setAlertMessage("투표할 항목을 선택해주세요.");
            setIsAlertOpen(true);
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            setAlertMessage("로그인이 필요합니다.");
            setIsAlertOpen(true);
            return;
        }

        try {
            const response = await fetch('/api/vote/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voteId: Number(voteId),
                    userId: userId,
                    itemIds: selectedItems
                })
            });

            if (response.ok) {
                setAlertMessage("투표가 완료되었습니다.");
                setIsAlertOpen(true);
                // Refresh to update UI to "Voted" state
                const url = `/api/vote/${voteId}?userId=${userId}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setVoteDetail(data);
                }
            } else {
                const errorMsg = await response.text();
                setAlertMessage(errorMsg || "투표 처리에 실패했습니다.");
                setIsAlertOpen(true);
            }
        } catch (error) {
            console.error("Error submitting vote:", error);
            setAlertMessage("오류가 발생했습니다.");
            setIsAlertOpen(true);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm flex flex-col">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                    <h2 className="text-lg font-bold text-[#003C48] flex-1 text-center mr-16">투표 참여</h2>
                </div>

                {/* Content */}
                {voteDetail ? (
                    <div className="p-6 flex-1 overflow-y-auto">

                        <h2 className="text-2xl font-bold text-[#003C48] text-center mb-1">{voteDetail.title}</h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => navigate(`/main/vote/status/${voteId}`)}
                                className="text-gray-500 text-xs underline decoration-gray-400 underline-offset-2"
                            >
                                현황 보기
                            </button>
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
                                disabled={isButtonDisabled}
                                className={`px-10 py-2.5 rounded-full text-lg font-bold shadow-md transition-transform active:scale-[0.98]
                                    ${isButtonDisabled
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                                        : voteDetail?.hasVoted
                                            ? 'bg-red-500 text-white hover:bg-red-600' // Cancel button style
                                            : 'bg-[#00BDF8] text-white hover:bg-[#009bc9]'
                                    }`}
                            >
                                {voteDetail?.hasVoted ? '투표 취소' : isVoteEnded ? '투표 종료' : '투표하기'}
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
                                <p>* {voteDetail.questions[0].questionType === 'MULT' ? '복수 선택 가능' : '복수 선택 불가능'}</p>
                                <p>* {voteDetail.isAnonymous ? '익명' : '기명'}</p>
                            </div>
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
                        if (!voteDetail || alertMessage.includes("완료")) navigate(-1);
                    }}
                />

            </div>
        </div>
    );
};

export default VoteDetail;
