import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

// 프로필 사진 컴포넌트 (파일 최상단 선언 - 리렌더링 안정성)
const UserAvatar: React.FC<{ userId: string; size?: number }> = ({ userId, size = 22 }) => {
    const [img, setImg] = React.useState<string | null | undefined>(undefined);
    React.useEffect(() => {
        fetch(`/api/user/profile/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setImg(d?.profileImageUrl || null))
            .catch(() => setImg(null));
    }, [userId]);
    if (img === undefined) return <div style={{ width: size, height: size }} className="rounded-full bg-gray-200 flex-shrink-0" />;
    if (img) return <img src={img} alt="" style={{ width: size, height: size }} className="rounded-full object-cover border border-gray-200 flex-shrink-0" />;
    return (
        <div style={{ width: size, height: size }} className="rounded-full bg-[#003C48] flex items-center justify-center flex-shrink-0">
            <svg style={{ width: size * 0.6, height: size * 0.6 }} fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
    );
};

interface MemberSession {
    userId: string;
    songTitle: string;
    artist: string;
    part: string;
    sessionTypeCd: string;
}

interface ClanMember {
    cnNo: number;
    cnUserId: string;
    cnUserRoleCd: string; // 01: Leader, 02: Executive, 03: Member
    cnUserApprStatCd: string; // RQ: Request, CN: Confirmed
    userNm: string;
    userNickNm: string;
    sessions: MemberSession[];
}

const ClanMemberStatus: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [allMembers, setAllMembers] = useState<ClanMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

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

    // Role Change Modal
    const [roleChangeModal, setRoleChangeModal] = useState({
        isOpen: false,
        userId: '',
        currentRole: '',
        targetRole: '02', // Default to Executive
    });

    const openRoleChangeModal = (userId: string, currentRole: string) => {
        setRoleChangeModal({
            isOpen: true,
            userId,
            currentRole,
            targetRole: '02',
        });
    };

    const closeRoleChangeModal = () => {
        setRoleChangeModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleRoleChange = async () => {
        if (!clanId || !roleChangeModal.userId) return;

        const proceedWithChange = async () => {
            try {
                const response = await fetch(`/api/clans/${clanId}/members/role`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: roleChangeModal.userId,
                        role: roleChangeModal.targetRole
                    }),
                });

                if (response.ok) {
                    await fetchMembers();
                    // If I was the leader and transferred leadership, I might need to refresh my own permissions/view
                    // For now, just alert and close
                    showAlert('직책이 변경되었습니다.');
                    closeRoleChangeModal();
                } else {
                    showAlert('직책 변경 실패');
                }
            } catch (error) {
                console.error("Role change failed", error);
                showAlert('오류 발생');
            }
        };

        if (roleChangeModal.targetRole === '01') {
            showConfirm(
                '클랜장을 위임하시겠습니까? 위임 후 본인은 간부로 변경됩니다.',
                proceedWithChange
            );
        } else {
            proceedWithChange();
        }
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

            {/* Role Change Modal */}
            {roleChangeModal.isOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-80 shadow-2xl animate-fade-in-up">
                        <h3 className="text-lg font-bold text-[#003C48] mb-4 text-center">직책 변경</h3>

                        <div className="flex flex-col gap-3 mb-6">
                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${roleChangeModal.targetRole === '01'
                                ? 'border-[#00BDF8] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="01"
                                    checked={roleChangeModal.targetRole === '01'}
                                    onChange={(e) => setRoleChangeModal(prev => ({ ...prev, targetRole: e.target.value }))}
                                    className="accent-[#00BDF8] w-5 h-5"
                                />
                                <span className="font-bold text-[#003C48]">클랜장 (Leader)</span>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${roleChangeModal.targetRole === '02'
                                ? 'border-[#00BDF8] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="02"
                                    checked={roleChangeModal.targetRole === '02'}
                                    onChange={(e) => setRoleChangeModal(prev => ({ ...prev, targetRole: e.target.value }))}
                                    className="accent-[#00BDF8] w-5 h-5"
                                />
                                <span className="font-bold text-[#003C48]">간부 (Executive)</span>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${roleChangeModal.targetRole === '03'
                                ? 'border-[#00BDF8] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="03"
                                    checked={roleChangeModal.targetRole === '03'}
                                    onChange={(e) => setRoleChangeModal(prev => ({ ...prev, targetRole: e.target.value }))}
                                    className="accent-[#00BDF8] w-5 h-5"
                                />
                                <span className="font-bold text-[#003C48]">일반 회원 (Member)</span>
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={closeRoleChangeModal}
                                className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRoleChange}
                                className="flex-1 py-3 text-white font-bold bg-[#00BDF8] rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-200"
                            >
                                변경
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="whitespace-nowrap bg-[#00BDF8] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-[#00a0d2]"
                    >
                        {isExpanded ? '접어두기' : '펼치기'}
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
                        <div key={member.cnUserId} className={`flex flex-col p-3 ${index !== activeMembers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[#003C48]">
                                    <UserAvatar userId={member.cnUserId} size={22} />
                                    <span className="text-sm font-bold">{member.userNickNm}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getRoleBadge(member.cnUserRoleCd)}
                                    {currentUserRole === '01' && member.cnUserRoleCd !== '01' && (
                                        <button
                                            onClick={() => openRoleChangeModal(member.cnUserId, member.cnUserRoleCd)}
                                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg font-bold hover:bg-gray-200"
                                        >
                                            변경
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Session List */}
                            {isExpanded && member.sessions && member.sessions.length > 0 && (
                                <div className="mt-3 pl-3 border-l-2 border-gray-100 space-y-2 animate-fade-in-down">
                                    {member.sessions.map((session, sIdx) => (
                                        <div key={sIdx} className="text-xs text-gray-600 flex items-center gap-2">
                                            <span className="font-bold text-[#00BDF8] min-w-[40px]">{session.part}</span>
                                            <span className="text-gray-500 truncate">{session.songTitle} - {session.artist}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isExpanded && (!member.sessions || member.sessions.length === 0) && (
                                <div className="mt-3 pl-3 text-xs text-gray-400 italic animate-fade-in-down">
                                    참여 중인 합주가 없습니다.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClanMemberStatus;
