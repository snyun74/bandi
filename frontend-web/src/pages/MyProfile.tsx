import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaRegCommentDots, FaBookmark, FaPen } from 'react-icons/fa';
import { BsPersonCircle } from 'react-icons/bs';
import CommonModal from '../components/common/CommonModal';

const MyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('홍길동');
    const [userAffiliation, setUserAffiliation] = useState('RetsmooD'); // Placeholder or fetch
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');

        if (userId) {
            fetch(`/api/auth/user/name?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.name) setUserName(data.name);
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleLogoutConfirm = () => {
        // Clear storage
        localStorage.clear();
        // Close modal
        setIsLogoutModalOpen(false);
        // Navigate to login/landing
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
                <button
                    onClick={handleLogoutClick}
                    className="bg-[#FF6B6B] text-white text-xs font-bold px-3 py-1.5 rounded-full"
                >
                    로그아웃
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Profile Info */}
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            {/* Placeholder for user image */}
                            <BsPersonCircle size={64} />
                        </div>
                        <div>
                            <div className="flex items-end gap-1">
                                <h2 className="text-[#003C48] text-xl font-bold">{userName} 님</h2>
                            </div>
                            <p className="text-gray-500 text-sm">소속 : {userAffiliation}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Box */}
                <div className="px-6 mb-6">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex justify-around items-center">
                        <div className="text-center">
                            <p className="text-gray-500 text-xs mb-1">매너점수</p>
                            <p className="text-[#003C48] font-bold text-lg">95점</p>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-gray-500 text-xs mb-1">분위기 메이커</p>
                            <p className="text-[#003C48] font-bold text-lg">3개</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 flex gap-3 mb-8">
                    <button className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl shadow-sm text-sm hover:bg-gray-200 transition-colors">
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
                        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3 text-[#003C48] font-bold">
                                <FaRegCommentDots className="text-gray-500" />
                                <span>고객센터</span>
                            </div>
                            <FaChevronRight className="text-gray-400" size={14} />
                        </button>
                    </div>
                    <div className="border-b border-gray-100">
                        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3 text-[#003C48] font-bold">
                                <FaBookmark className="text-gray-500" />
                                <span>스크랩</span>
                            </div>
                            <FaChevronRight className="text-gray-400" size={14} />
                        </button>
                    </div>
                    <div className="border-b border-gray-100">
                        <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50">
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
        </div>
    );
};

export default MyProfile;
