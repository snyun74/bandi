import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaUserSlash } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import ProfileEditModal from '../components/profile/ProfileEditModal';

interface AdminUser {
    userId: string;
    userNm: string;
    userNickNm: string;
    joinDay: string;
    userStatCd: string;
    profileImageUrl: string | null;
    insDtime: string;
}

const AdminUserManagement: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(30);
    const [userStats, setUserStats] = useState<{ total: number; male: number; female: number; other: number }>({
        total: 0,
        male: 0,
        female: 0,
        other: 0
    });

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users/list');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }

            // Fetch Stats
            const statsRes = await fetch('/api/admin/users/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setUserStats(statsData);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleWithdraw = (userId: string) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            message: `${userId} 회원을 탈퇴 처리하시겠습니까?`,
            onConfirm: async () => {
                const currentAdminId = localStorage.getItem('userId');
                try {
                    const response = await fetch(`/api/admin/users/${userId}/withdraw`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updId: currentAdminId })
                    });
                    if (response.ok) {
                        setModal({
                            isOpen: true,
                            type: 'alert',
                            message: '탈퇴 처리가 완료되었습니다.',
                            onConfirm: () => {
                                setModal(prev => ({ ...prev, isOpen: false }));
                                fetchUsers();
                            }
                        });
                    } else {
                        showAlert('처리에 실패했습니다.');
                    }
                } catch (error) {
                    console.error("Withdrawal failed", error);
                    showAlert('오류가 발생했습니다.');
                }
            }
        });
    };

    const showAlert = (message: string) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        // YY.MM.DD
        return `${dateStr.substring(2, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    const filteredUsers = users.filter(user => 
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userNm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userNickNm.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const visibleUsers = filteredUsers.slice(0, visibleCount);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (visibleCount < filteredUsers.length) {
                setVisibleCount(prev => prev + 30);
            }
        }
    };

    return (
        <div className="flex flex-col bg-white font-['Pretendard'] h-[calc(100vh-130px)]" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-[#052c42] mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-[14px] font-bold text-[#003C48]">회원 관리</h1>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden">
                {/* Stats Breakdown */}
                <div className="flex justify-end mb-4">
                    <div className="text-[12px] text-gray-600 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                        회원수 : <span className="font-medium">{userStats.total}</span> 명, 
                        남자 : <span className="font-medium">{userStats.male}</span>명, 
                        여자 : <span className="font-medium">{userStats.female}</span>명, 
                        기타 : <span className="font-medium">{userStats.other}</span> 명
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="아이디, 이름, 닉네임 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00BDF8] transition-colors"
                    />
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto relative" onScroll={handleScroll}>
                    <table className="w-full text-[10px] text-left border-separate border-spacing-0">
                        <thead className="sticky top-0 z-20 text-[10px] text-gray-500 uppercase bg-gray-50 shadow-sm">
                            <tr>
                                <th className="px-3 py-3 font-bold bg-gray-50 border-y border-gray-100">사진</th>
                                <th className="px-3 py-3 font-bold bg-gray-50 border-y border-gray-100">아이디</th>
                                <th className="px-3 py-3 font-bold bg-gray-50 border-y border-gray-100">이름</th>
                                <th className="px-3 py-3 font-bold bg-gray-50 border-y border-gray-100">닉네임</th>
                                <th className="px-3 py-3 font-bold bg-gray-50 border-y border-gray-100">가입일자</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-10 text-center text-gray-400">데이터를 불러오는 중...</td>
                                </tr>
                            ) : visibleUsers.length > 0 ? (
                                visibleUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                        <td className="px-3 py-3">
                                            <div 
                                                className="w-5 h-5 rounded-full overflow-hidden border border-gray-100 cursor-pointer hover:scale-105 transition-transform"
                                                onClick={() => {
                                                    setSelectedUserId(user.userId);
                                                    setIsProfileModalOpen(true);
                                                }}
                                            >
                                                {user.profileImageUrl ? (
                                                    <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src="/images/default_profile.png" alt="" className="w-full h-full object-cover opacity-60" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 font-medium text-[#003C48]">{user.userId}</td>
                                        <td className="px-3 py-3">{user.userNm}</td>
                                        <td className="px-3 py-3">{user.userNickNm}</td>
                                        <td className="px-3 py-3 text-gray-500">{formatDate(user.joinDay)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-3 py-10 text-center text-gray-400">검색 결과가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile Viewer Modal */}
            {selectedUserId && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                        setIsProfileModalOpen(false);
                        setSelectedUserId(null);
                    }}
                    userId={selectedUserId}
                    onProfileUpdate={fetchUsers}
                    isReadOnly={true}
                />
            )}
        </div>
    );
};

export default AdminUserManagement;
