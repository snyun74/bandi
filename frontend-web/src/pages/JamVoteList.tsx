import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface JamVoteListDto {
    bnVoteNo: number;
    title: string;
    voteStatCd: string;
    endTime: string;
    hasVoted: boolean;
    expired: boolean;
    participantCount: number;
}

const JamVoteList: React.FC = () => {
    const { roomNo } = useParams<{ roomNo: string }>();
    const navigate = useNavigate();
    const [votes, setVotes] = useState<JamVoteListDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVotes = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                const response = await fetch(`/api/jam-vote/list/${roomNo}?userId=${userId}`);
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

    const handleVoteClick = (vote: JamVoteListDto) => {
        navigate(`/main/jam/vote/${vote.bnVoteNo}`);
    };

    return (
        <div className="w-full bg-white font-['Jua'] flex flex-col" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 bg-white">
                <button onClick={() => navigate(-1)} className="text-gray-500 mr-2 flex items-center text-sm">
                    <FaChevronLeft className="mr-1" /> 뒤로 가기
                </button>
            </div>

            <h1 className="text-xl font-bold text-[#003C48] text-center mb-6">투표 목록</h1>

            <div className="px-4 space-y-3 pb-10">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">로딩 중...</div>
                ) : votes.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">진행 중인 투표가 없습니다.</div>
                ) : (
                    votes.map((vote) => {
                        const isActive = !vote.expired && vote.voteStatCd === 'A';
                        const isBlue = isActive && !vote.hasVoted;

                        return (
                            <div
                                key={vote.bnVoteNo}
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
        </div>
    );
};

export default JamVoteList;
