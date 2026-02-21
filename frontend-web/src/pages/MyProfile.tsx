import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBookmark, FaPen } from 'react-icons/fa';
import { BsPersonCircle, BsChatSquare } from 'react-icons/bs';
import CommonModal from '../components/common/CommonModal';
import ProfileEditModal from '../components/profile/ProfileEditModal';

interface UserSkillDto {
    sessionTypeCd: string;
    sessionTypeNm: string;
    score: number;
}

interface UserProfileDto {
    userId: string;
    userNm: string;
    userNickNm: string;
    email: string;
    profileImageUrl: string | null;
    mannerScore?: number;
    moodMakerCount?: number;
    adminYn?: string;
    skills: UserSkillDto[];
}

const MyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const userId = localStorage.getItem('userId');

    const fetchProfile = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/user/profile/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        localStorage.clear();
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">프로필</h1>
                </div>
                <div className="flex items-center gap-2">
                    {profile?.adminYn === 'Y' && (
                        <button
                            onClick={() => navigate('/main/admin')}
                            className="bg-[#003C48] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-[#002B36] transition-colors"
                        >
                            ADMIN
                        </button>
                    )}
                    <button
                        onClick={handleLogoutClick}
                        className="bg-[#FF6B6B] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow hover:bg-[#FF5252] transition-colors"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Info */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                            {profile?.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <BsPersonCircle size={64} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-end gap-1">
                                <h2 className="text-[#003C48] text-xl font-bold">
                                    {profile?.userNickNm || profile?.userNm || '사용자'} 님
                                </h2>
                            </div>
                            <p className="text-gray-500 text-sm">{profile?.email || '이메일 없음'}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Box */}
                <div className="px-6 mb-6">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-around items-center">
                        <div className="text-center">
                            <p className="text-gray-500 text-xs mb-1">매너점수</p>
                            <p className="text-[#003C48] font-bold text-lg">{profile?.mannerScore !== undefined ? `${profile.mannerScore}점` : '0점'}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-gray-500 text-xs mb-1">분위기 메이커</p>
                            <p className="text-[#003C48] font-bold text-lg">{profile?.moodMakerCount !== undefined ? `${profile.moodMakerCount}개` : '0개'}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 flex gap-3 mb-8">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm text-sm hover:bg-gray-200 transition-colors"
                    >
                        프로필 편집
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm text-sm hover:bg-gray-200 transition-colors">
                        개인 연습실
                    </button>
                </div>

                {/* Gallery (Placeholder) */}
                <div className="px-4 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {/* Mock Images - Using placeholders or simple divs */}
                    <div className="inline-flex gap-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden relative border border-gray-100">
                                {/* Placeholder Image content */}
                                <img src={`https://picsum.photos/150/150?random=${i}`} alt="Gallery" className="w-full h-full object-cover" />
                                <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded-full text-white">
                                    <FaBookmark size={10} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <div className="bg-white border-t border-gray-100">
                    <div className="border-b border-gray-100">
                        <button onClick={() => navigate('/main/customer-center')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3 text-[#003C48] font-bold">
                                <BsChatSquare className="text-gray-500" size={16} />
                                <span>고객센터</span>
                            </div>
                            <FaChevronRight className="text-gray-400" size={14} />
                        </button>
                    </div>
                    <div className="border-b border-gray-100">
                        <button onClick={() => navigate('/main/profile/scraps')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3 text-[#003C48] font-bold">
                                <FaBookmark className="text-gray-500" />
                                <span>스크랩</span>
                            </div>
                            <FaChevronRight className="text-gray-400" size={14} />
                        </button>
                    </div>
                    <div className="border-b border-gray-100">
                        <button onClick={() => navigate('/main/profile/posts')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3 text-[#003C48] font-bold">
                                <FaPen className="text-gray-500" />
                                <span>내가 쓴 글</span>
                            </div>
                            <FaChevronRight className="text-gray-400" size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <CommonModal
                isOpen={isLogoutModalOpen}
                type="confirm"
                message="로그아웃 하시겠습니까?"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setIsLogoutModalOpen(false)}
            />

            {/* Profile Edit Modal */}
            {userId && (
                <ProfileEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    userId={userId}
                    onProfileUpdate={fetchProfile}
                />
            )}
        </div>
    );
};

export default MyProfile;
