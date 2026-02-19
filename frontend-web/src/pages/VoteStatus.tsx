
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaUserCircle } from 'react-icons/fa';

const VoteStatus: React.FC = () => {
    const { voteId } = useParams<{ voteId: string }>();
    const navigate = useNavigate();
    const [voteStatus, setVoteStatus] = useState<any>(null); // Replace with proper interface
    const [loading, setLoading] = useState(true);


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

    const maxCount = Math.max(...voteStatus.options.map((o: any) => o.count), 0);

    return (
        <div className="w-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-120px)] shadow-sm flex flex-col">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                    <h2 className="text-lg font-bold text-[#003C48] flex-1 text-center mr-16">투표 현황</h2>
                </div>

                <div className="p-6 flex-1">
                    <h2 className="text-2xl font-bold text-[#003C48] text-center mb-8">{voteStatus.title}</h2>

                    {/* Vote Result List */}
                    <div className="space-y-8">
                        {voteStatus.options.map((option: any, index: number) => {
                            const ratio = maxCount > 0 ? option.count / maxCount : 0;
                            const isZero = option.count === 0;
                            const headerStyle = isZero ? {} : { backgroundColor: `rgba(0, 189, 248, ${0.2 + (0.8 * ratio)})` };
                            const textColorClass = isZero ? 'text-gray-700' : (ratio > 0.6 ? 'text-white' : 'text-[#003C48]');

                            return (
                                <div key={option.cnVoteItemNo}>
                                    {/* Progress Bar Header */}
                                    <div
                                        className={`flex items-center justify-between px-4 py-3 rounded-t-xl border border-gray-200 shadow-sm relative overflow-hidden ${isZero ? 'bg-gray-100' : ''} ${textColorClass}`}
                                        style={headerStyle}
                                    >
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
                            );
                        })}
                    </div>

                </div>


            </div>
        </div>
    );
};

export default VoteStatus;
