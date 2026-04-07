import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaBookmark, FaPen, FaBars } from 'react-icons/fa';
import { BsPersonCircle, BsChatSquare, BsDoorOpen } from 'react-icons/bs';
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
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const userId = localStorage.getItem('userId');

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertModalOpen(true);
    };

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogoutClick = () => {
        setIsMenuOpen(false);
        setIsLogoutModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        localStorage.clear();
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-20 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#003C48]">프로필</h1>
                </div>
                <div className="flex items-center gap-2 relative">
                    {profile?.adminYn === 'Y' && (
                        <button
                            onClick={() => navigate('/main/admin')}
                            className="bg-[#003C48] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-[#002B36] transition-colors"
                        >
                            ADMIN
                        </button>
                    )}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaBars size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            <button
                                onClick={() => { setIsMenuOpen(false); showAlert("작업 진행중입니다."); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <BsDoorOpen className="text-gray-400" size={16} />
                                <span>개인 연습실</span>
                            </button>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/customer-center'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <BsChatSquare className="text-gray-400" size={16} />
                                <span>고객센터</span>
                            </button>
                            <div className="mx-3 h-[1px] bg-gray-50"></div>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/profile/scraps'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <FaBookmark className="text-gray-400" />
                                <span>스크랩</span>
                            </button>
                            <button
                                onClick={() => { setIsMenuOpen(false); navigate('/main/profile/posts'); }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <FaPen className="text-gray-400" size={14} />
                                <span>내가 쓴 글</span>
                            </button>
                            <div className="mx-3 h-[1px] bg-gray-100"></div>
                            <button
                                onClick={handleLogoutClick}
                                className="w-full px-4 py-3 text-left text-sm text-[#FF6B6B] font-medium hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>로그아웃</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Info */}
                <div className="px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all active:scale-95 relative group"
                        >
                            {profile?.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img src="/images/default_profile.png" alt="Default Profile" className="w-full h-full object-cover opacity-50" />
                            )}
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <FaPen className="text-white drop-shadow-md" size={14} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-end gap-1">
                                <h2 className="text-[#003C48] font-bold text-[14px] leading-tight">
                                    {profile?.userNickNm || profile?.userNm || '사용자'} 님
                                </h2>
                            </div>
                            <p className="text-gray-400 text-xs mt-1">{profile?.email || '이메일 없음'}</p>
                        </div>
                    </div>

                    {/* Compact Stats */}
                    <div className="flex flex-col gap-1 items-end bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/50 shadow-sm">
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">매너점수</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.mannerScore !== undefined ? `${profile.mannerScore}점` : '0점'}</span>
                        </div>
                        <div className="w-full h-[1px] bg-gray-200/50 my-0.5"></div>
                        <div className="flex items-center gap-2 justify-end w-full">
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">분위기메이커</span>
                            <span className="text-gray-500 font-bold text-xs min-w-[35px] text-right">{profile?.moodMakerCount !== undefined ? `${profile.moodMakerCount}회` : '0회'}</span>
                        </div>
                    </div>
                </div>

                {/* Post Grid (Instagram Style) */}
                <div className="px-0.5 py-0.5">
                    <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <div
                                key={i}
                                className="aspect-[4/5] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex flex-col items-center justify-center text-gray-300 relative group cursor-pointer hover:brightness-95 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-40 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] opacity-40">게시물 {i}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Create Buttons - Moved to Bottom */}
                <div className="px-5 py-8 mt-4 flex gap-2">
                    <button
                        disabled
                        className="flex-1 bg-[#F8F9FA] text-[#ADB5BD] font-bold py-3.5 rounded-2xl text-[14px] cursor-not-allowed border border-gray-100/50 flex flex-col items-center justify-center gap-1 opacity-70"
                    >
                        <span className="text-lg grayscale">📸</span>
                        <span>게시물 만들기</span>
                    </button>
                    <button
                        disabled
                        className="flex-1 bg-[#F8F9FA] text-[#ADB5BD] font-bold py-3.5 rounded-2xl text-[14px] cursor-not-allowed border border-gray-100/50 flex flex-col items-center justify-center gap-1 opacity-70"
                    >
                        <span className="text-lg grayscale">🎬</span>
                        <span>쇼츠 만들기</span>
                    </button>
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

            {/* General Alert Modal */}
            <CommonModal
                isOpen={isAlertModalOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertModalOpen(false)}
            />
        </div>
    );
};

export default MyProfile;
