import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaSearch } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface ClanMember {
    cnNo: number;
    cnUserId: string;
    cnUserRoleCd: string; // 01: Leader, 02: Executive, 03: Member
    cnUserApprStatCd: string; // RQ: Request, CN: Confirmed
    userNm: string;
    userNickNm: string;
}

const ClanMemberStatus: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [allMembers, setAllMembers] = useState<ClanMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    const showConfirm = (message: string, onConfirm: () => void) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            message,
            onConfirm: () => {
                closeModal();
                onConfirm();
            },
        });
    };

    const fetchMembers = async () => {
        if (!clanId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/members`);
            if (response.ok) {
                const data = await response.json();
                setAllMembers(data);
            }
        } catch (error) {
            console.error("Failed to fetch clan members", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [clanId]);

    const joinRequests = allMembers.filter(m => m.cnUserApprStatCd === 'RQ');
    const activeMembers = allMembers.filter(m => m.cnUserApprStatCd === 'CN');

    // Get current user ID from localStorage
    const currentUserId = localStorage.getItem('userId');

    // Find current user's role
    const currentUserRole = allMembers.find(m => m.cnUserId === currentUserId)?.cnUserRoleCd;

    // Check if user is Leader (01) or Executive (02)
    const canManageRequests = currentUserRole === '01' || currentUserRole === '02';

    const handleAction = async (userId: string, action: 'CN' | 'RJ', showSuccessAlert = true) => {
        if (!clanId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/members/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, status: action }),
            });

            if (response.ok) {
                if (showSuccessAlert) {
                    await fetchMembers();
                    const message = action === 'CN' ? '가입이 승인되었습니다.' : '가입이 거절되었습니다.';
                    showAlert(message);
                }
            } else {
                showAlert('처리 실패');
            }
        } catch (error) {
            console.error("Action failed", error);
            showAlert('오류 발생');
        }
    };

    const handleAcceptAll = () => {
        showConfirm('모든 가입 신청을 수락하시겠습니까?', async () => {
            let hasError = false;
            // Loop through requests without showing individual alerts/refreshes
            for (const req of joinRequests) {
                try {
                    await fetch(`/api/clans/${clanId}/members/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: req.cnUserId, status: 'CN' }),
                    });
                } catch (e) {
                    hasError = true;
                }
            }

            await fetchMembers();

            if (!hasError) {
                showAlert('모든 회원 가입 신청이 승인되었습니다.');
            } else {
                showAlert('일부 요청 처리에 실패했습니다.');
            }
        });
    };

    const getRoleBadge = (roleCd: string) => {
        if (roleCd === '01') return <span className="text-[#00BDF8] text-sm font-bold">클랜장</span>;
        if (roleCd === '02') return <span className="text-[#00BDF8] text-sm font-bold">간부</span>;
        return null;
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">멤버 현황</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center border border-[#00BDF8] rounded-xl px-3 py-2 bg-white">
                        <FaSearch className="text-[#00BDF8] mr-2" />
                        <input
                            type="text"
                            placeholder="닉네임, 곡명, 아티스트로 검색"
                            className="flex-1 outline-none text-sm placeholder-gray-400"
                        />
                    </div>
                    <button className="whitespace-nowrap bg-[#00BDF8] text-white px-4 py-2 rounded-xl text-sm font-bold">
                        접어두기
                    </button>
                </div>

                {/* Join Requests - Only if exists AND user is admin/executive */}
                {canManageRequests && joinRequests.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[#003C48] font-bold text-sm">클랜 가입 신청</h2>
                            <button onClick={handleAcceptAll} className="bg-[#00BDF8] text-white text-[10px] px-2 py-0.5 rounded-full">모두 수락</button>
                        </div>
                        <div className="space-y-2">
                            {joinRequests.map(req => (
                                <div key={req.cnUserId} className="flex justify-between items-center">
                                    <span className="text-[#003C48] text-sm">{req.userNickNm} ({req.userNm})</span>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleAction(req.cnUserId, 'RJ')} className="bg-[#FF8A80] text-white text-xs px-2 py-0.5 rounded-full font-bold">거절</button>
                                        <button onClick={() => handleAction(req.cnUserId, 'CN')} className="bg-[#00BDF8] text-white text-xs px-2 py-0.5 rounded-full font-bold">수락</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Member List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-2">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-baseline gap-2 mb-2">
                        <h2 className="text-[#003C48] font-bold text-sm">멤버 목록</h2>
                        <span className="text-[#00BDF8] text-xs font-bold">{activeMembers.length}명</span>
                    </div>
                    {activeMembers.map((member, index) => (
                        <div
                            key={member.cnUserId}
                            className={`flex justify-between items-center p-3 ${index !== activeMembers.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2 text-[#003C48]">
                                {/* Assuming Generation is not available in query yet, omitting or relying on nickname convention if any */}
                                <span className="text-sm font-bold">{member.userNickNm}</span>
                            </div>
                            {getRoleBadge(member.cnUserRoleCd)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClanMemberStatus;
