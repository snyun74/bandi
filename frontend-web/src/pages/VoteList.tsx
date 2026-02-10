import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface VoteListDto {
    cnVoteNo: number;
    title: string;
    voteStatCd: string;
    endTime: string;
    hasVoted: boolean;
    expired: boolean;
    participantCount: number;
}

const VoteList: React.FC = () => {
    const { roomNo } = useParams<{ roomNo: string }>();
    const navigate = useNavigate();
    const [votes, setVotes] = useState<VoteListDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVotes = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                const response = await fetch(`/api/vote/list/${roomNo}?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setVotes(data);
                } else {
                    console.error("Failed to fetch vote list");
                }
            } catch (error) {
                console.error("Error fetching vote list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVotes();
    }, [roomNo]);

    const handleVoteClick = (vote: VoteListDto) => {
        // If expired or voted, maybe show status? Or always detail?
        // Existing logic: Detail checks status and hasVoted to show results or form.
        // So safe to navigate to Detail.
        // But if we want to separate "Status" view explicitly, we can.
        // For now, let's route to /vote/:voteId which handles logic.
        // Actually, user wants "Status" screen if already voted? 
        // Let's stick to /vote/:voteId for now, as it redirects or shows correct view usually.
        // Wait, current /vote/:voteId maps to VoteDetail.tsx.
        // VoteDetail handles "Already voted" by showing "View Status" button or just UI.
        // Let's use that.
        navigate(`/main/vote/${vote.cnVoteNo}`);
    };

    return (
        <div className="min-h-screen bg-white font-['Jua'] flex flex-col" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 bg-white">
                <button onClick={() => navigate(-1)} className="text-gray-500 mr-2 flex items-center text-sm">
                    <FaChevronLeft className="mr-1" /> 뒤로 가기
                </button>
            </div>

            <h1 className="text-xl font-bold text-[#003C48] text-center mb-6">투표 목록</h1>

            <div className="px-4 space-y-3 flex-1 overflow-y-auto pb-10">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">로딩 중...</div>
                ) : votes.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">진행 중인 투표가 없습니다.</div>
                ) : (
                    votes.map((vote) => {
                        // Style logic
                        // Active & Not Voted: Blue
                        // Active & Voted: White (Border)
                        // Expired: White (Gray text)

                        const isActive = !vote.expired && vote.voteStatCd === 'A';
                        const isBlue = isActive && !vote.hasVoted;

                        return (
                            <div
                                key={vote.cnVoteNo}
                                onClick={() => handleVoteClick(vote)}
                                className={`
                                    w-full px-5 py-4 rounded-[20px] flex items-center justify-between shadow-md cursor-pointer transition-transform active:scale-95
                                    ${isBlue
                                        ? 'bg-[#00BDF8] text-white'
                                        : 'bg-white border border-gray-100 text-[#003C48]'
                                    }
                                `}
                            >
                                <div className="flex flex-col items-start min-w-0 flex-1 mr-2">
                                    <span className={`text-lg font-bold truncate w-full ${!isActive ? 'text-gray-400' : ''}`}>
                                        {vote.title}
                                    </span>
                                    {!isActive && <span className="text-xs text-gray-400 mt-1">마감됨</span>}
                                    {vote.hasVoted && isActive && <span className="text-xs text-[#00BDF8] mt-1">참여 완료</span>}
                                </div>
                                <FaChevronRight className={`${isBlue ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Create Button if needed? User didn't ask, but ChatRoom menu has 'Vote Create' */}
        </div>
    );
};

export default VoteList;
