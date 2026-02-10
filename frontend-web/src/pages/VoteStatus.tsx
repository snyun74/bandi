
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaUserCircle } from 'react-icons/fa';

const VoteStatus: React.FC = () => {
    const { voteId } = useParams<{ voteId: string }>();
    const navigate = useNavigate();
    const [voteStatus, setVoteStatus] = useState<any>(null); // Replace with proper interface
    const [loading, setLoading] = useState(true);

    // Mock Data for comments (keeping as requested)
    const comments = [
        { id: 1, author: "렛무장", text: "불참 시 사유 작성해주세요", time: "17:09", isMe: false },
        { id: 2, author: "나", text: "수업이 있습니다ㅠ", time: "17:09", isMe: true },
    ];

    React.useEffect(() => {
        const fetchVoteStatus = async () => {
            try {
                const response = await fetch(`/api/vote/${voteId}/status`);
                if (response.ok) {
                    const data = await response.json();
                    setVoteStatus(data);
                } else {
                    console.error("Failed to fetch vote status");
                }
            } catch (error) {
                console.error("Error fetching vote status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVoteStatus();
    }, [voteId]);

    const getPercentage = (count: number) => {
        if (!voteStatus || voteStatus.totalVotes === 0) return 0;
        // Calculation based on total people or total votes?
        // If multiple choice, sum of counts > total people.
        // Usually percentage is based on total people involved for attendance check.
        // Let's use totalVotes (people count) from DTO.
        return Math.round((count / voteStatus.totalVotes) * 100);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!voteStatus) return <div className="min-h-screen flex items-center justify-center">투표 정보를 찾을 수 없습니다.</div>;

    return (
        <div className="min-h-screen bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm flex flex-col">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                    <h2 className="text-lg font-bold text-[#003C48] flex-1 text-center mr-16">투표 현황</h2>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-[#003C48] text-center mb-8">{voteStatus.title}</h2>

                    {/* Vote Result List */}
                    <div className="space-y-8">
                        {voteStatus.options.map((option: any, index: number) => (
                            <div key={option.cnVoteItemNo}>
                                {/* Progress Bar Header */}
                                <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${index === 0 ? 'bg-[#00BDF8] text-white' : 'bg-gray-100 text-gray-700'} border border-gray-200 shadow-sm relative overflow-hidden`}>
                                    <span className="font-bold relative z-10">{option.itemText}</span>
                                    <span className="font-bold relative z-10">{getPercentage(option.count)}% ({option.count}명)</span>
                                </div>

                                {/* Voters Grid */}
                                <div className="border-x border-b border-gray-200 rounded-b-xl p-4">
                                    <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                        {option.voters.map((voter: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-center space-x-1">
                                                <FaUserCircle className="text-gray-400 text-xl" />
                                                <span className="text-sm text-gray-600 truncate max-w-[80px]">{voter.userName}</span>
                                            </div>
                                        ))}
                                        {option.voters.length === 0 && (
                                            <div className="col-span-3 text-center text-gray-400 text-sm py-2">
                                                투표자가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="my-8 border-t border-gray-200"></div>

                    {/* Chat/Comments Section */}
                    <div className="space-y-4 mb-20">
                        {comments.map((comment) => (
                            <div key={comment.id} className={`flex flex-col ${comment.isMe ? 'items-end' : 'items-start'}`}>
                                {!comment.isMe && (
                                    <div className="flex items-center mb-1 space-x-1">
                                        <FaUserCircle className="text-gray-400" />
                                        <span className="text-xs text-gray-500">{comment.author}</span>
                                    </div>
                                )}
                                <div className="flex items-end space-x-1">
                                    {!comment.isMe && (
                                        <div className={`px-4 py-2 rounded-2xl bg-white border border-gray-200 text-sm max-w-[80%] text-gray-700`}>
                                            {comment.text}
                                        </div>
                                    )}

                                    <span className="text-[10px] text-gray-400 min-w-fit mb-1">{comment.time}</span>

                                    {comment.isMe && (
                                        <div className={`px-4 py-2 rounded-2xl bg-white border border-[#00BDF8] text-sm max-w-[80%] text-black`}>
                                            {comment.text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                    <input
                        type="text"
                        placeholder="댓글 (준비중)"
                        disabled
                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#00BDF8] bg-gray-100 text-sm cursor-not-allowed"
                    />
                </div>

            </div>
        </div>
    );
};

export default VoteStatus;
