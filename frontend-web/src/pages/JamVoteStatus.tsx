import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import SectionTitle from '../components/common/SectionTitle';
import ProfileEditModal from '../components/profile/ProfileEditModal';

const VoterAvatar: React.FC<{ userId: string }> = ({ userId }) => {
    const [img, setImg] = React.useState<string | null | undefined>(undefined);
    React.useEffect(() => {
        if (!userId) return;
        fetch(`/api/user/profile/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setImg(d?.profileImageUrl || null))
            .catch(() => setImg(null));
    }, [userId]);
    if (img) {
        return <img src={img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />;
    }
    return (
        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
            <img src="/images/default_profile.png" alt="" className="w-full h-full object-cover opacity-60" />
        </div>
    );
};

const JamVoteStatus: React.FC = () => {
    const { voteId } = useParams<{ voteId: string }>();
    const navigate = useNavigate();
    const [voteStatus, setVoteStatus] = useState<any>(null); // Replace with proper interface
    const [loading, setLoading] = useState(true);

    // Profile Modal State
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


    React.useEffect(() => {
        const fetchVoteStatus = async () => {
            try {
                const response = await fetch(`/api/jam-vote/${voteId}/status`);
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
        return Math.round((count / voteStatus.totalVotes) * 100);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!voteStatus) return <div className="min-h-screen flex items-center justify-center">투표 정보를 찾을 수 없습니다.</div>;

    const maxCount = Math.max(...voteStatus.options.map((o: any) => o.count), 0);

    return (
        <div className="w-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-120px)] shadow-sm flex flex-col">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="text-[#052c42] mr-2">
                        <FaChevronLeft size={24} />
                    </button>
                    <SectionTitle as="h1" className="!mt-0 !mb-0 flex-1 text-center mr-16">투표 현황</SectionTitle>
                </div>

                <div className="p-6 flex-1">
                    <SectionTitle as="h2" className="text-center mb-8">{voteStatus.title}</SectionTitle>

                    {/* Vote Result List */}
                    <div className="space-y-8">
                        {voteStatus.options.map((option: any, index: number) => {
                            const ratio = maxCount > 0 ? option.count / maxCount : 0;
                            const isZero = option.count === 0;
                            const headerStyle = isZero ? {} : { backgroundColor: `rgba(0, 189, 248, ${0.2 + (0.8 * ratio)})` };
                            const textColorClass = isZero ? 'text-gray-700' : (ratio > 0.6 ? 'text-white' : 'text-[#003C48]');

                            return (
                                <div key={option.bnVoteItemNo}>
                                    {/* Progress Bar Header */}
                                    <div
                                        className={`flex items-center justify-between px-4 py-3 rounded-t-xl border border-gray-200 shadow-sm relative overflow-hidden ${isZero ? 'bg-gray-100' : ''} ${textColorClass}`}
                                        style={headerStyle}
                                    >
                                        <SectionTitle as="h4" className="!mt-0 !mb-0 relative z-10 text-inherit">{option.itemText}</SectionTitle>
                                        <span className="font-bold relative z-10">{getPercentage(option.count)}% ({option.count}명)</span>
                                    </div>

                                    {/* Voters Grid */}
                                    <div className="border-x border-b border-gray-200 rounded-b-xl p-4">
                                        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                            {option.voters.map((voter: any, idx: number) => (
                                                <div 
                                                    key={idx} 
                                                    className="flex items-center justify-center space-x-1.5 cursor-pointer group py-1 px-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                                    onClick={() => {
                                                        if (voter.userId) {
                                                            setSelectedUserId(voter.userId);
                                                            setIsProfileModalOpen(true);
                                                        }
                                                    }}
                                                    title="프로필 보기"
                                                >
                                                    <div className="group-hover:ring-2 group-hover:ring-[#00BDF8] group-hover:scale-105 active:scale-95 rounded-full transition-all">
                                                        <VoterAvatar userId={voter.userId} />
                                                    </div>
                                                    <span className="text-sm text-gray-700 font-medium group-hover:underline group-hover:text-[#00BDF8] truncate max-w-[80px] transition-colors">{voter.userName}</span>
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

            {/* User Profile Modal */}
            {selectedUserId && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                        setIsProfileModalOpen(false);
                        setSelectedUserId(null);
                    }}
                    userId={selectedUserId}
                    onProfileUpdate={() => {}}
                    isReadOnly={selectedUserId !== localStorage.getItem('userId')}
                />
            )}
        </div>
    );
};

export default JamVoteStatus;
