import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaLock, FaInfoCircle } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import SectionTitle from '../components/common/SectionTitle';

interface JamRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part: string;
    user?: string;
    status: 'empty' | 'occupied' | 'reserved';
    reservedCount?: number;
    isCurrentUser?: boolean;
    isBandLeader?: boolean;
    userId?: string;
    reservedUsers?: string[];
}

interface JamRoom {
    id: number;
    title: string;
    songTitle: string;
    artist: string;
    secret?: boolean;
    isMember?: boolean;
    isConfirmed?: boolean;
    status?: string;
    description?: string;
    roles: JamRole[];
}

const ClanJamList: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
    const [userRole, setUserRole] = useState<string>(""); // '01': Leader, '02': Executive
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!clanId || !userId) return;
            try {
                const response = await fetch(`/api/clans/${clanId}/members/${userId}/role`);
                if (response.ok) {
                    const role = await response.text();
                    setUserRole(role);
                }
            } catch (error) {
                console.error("Failed to fetch user role", error);
            }
        };
        fetchUserRole();
    }, [clanId, userId]);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string) => {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    const showConfirm = (message: string, onConfirm: () => void) => {
        setModalConfig({
            isOpen: true,
            type: 'confirm',
            message,
            onConfirm: () => {
                onConfirm();
                closeModal();
            },
        });
    };

    const [jamRooms, setJamRooms] = useState<JamRoom[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortOption, setSortOption] = useState<string>('sort:latest');
    const [sessionCodes, setSessionCodes] = useState<{ commDtlCd: string; commDtlNm: string; commOrder: number }[]>([]);

    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        bnNo: 0,
        password: '',
    });

    const [rsvModal, setRsvModal] = useState<{
        isOpen: boolean;
        bnNo: number;
        sessionTypeCd: string;
        sessionName: string;
        reservations: { rsvNo: number; userId: string; userNickNm: string; sessionName: string }[];
    }>({ isOpen: false, bnNo: 0, sessionTypeCd: '', sessionName: '', reservations: [] });

    const [descModal, setDescModal] = useState({
        isOpen: false,
        title: '',
        description: '',
    });

    const openDescModal = (e: React.MouseEvent, room: JamRoom) => {
        e.stopPropagation();
        setDescModal({
            isOpen: true,
            title: room.title,
            description: room.description || "상세 설명이 없습니다.",
        });
    };

    const handleRoomClick = (room: JamRoom) => {
        if (room.secret) {
            setPasswordModal({
                isOpen: true,
                bnNo: room.id,
                password: '',
            });
        } else {
            navigate(`/main/clan/jam/room/${room.id}`);
        }
    };

    const verifyPasswordAndNavigate = async () => {
        try {
            const response = await fetch(`/api/bands/${passwordModal.bnNo}/verify-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: passwordModal.password }),
            });

            if (response.ok) {
                setPasswordModal(prev => ({ ...prev, isOpen: false }));
                navigate(`/main/clan/jam/room/${passwordModal.bnNo}`);
            } else {
                showAlert("비밀번호가 일치하지 않습니다.");
            }
        } catch (error) {
            console.error("Password verification failed", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        const fetchCodes = async () => {
            try {
                const response = await fetch('/api/common/codes/BD100');
                if (response.ok) {
                    const data = await response.json();
                    setSessionCodes(data.sort((a: any, b: any) => a.commOrder - b.commOrder));
                }
            } catch (error) {
                console.error("Failed to fetch codes", error);
            }
        };
        fetchCodes();
    }, []);

    const fetchJamRooms = async (keyword: string = '') => {
        const userId = localStorage.getItem('userId');

        let sortParam = '';
        let filterPartParam = '';

        if (sortOption.startsWith('sort:')) {
            sortParam = sortOption.replace('sort:', '');
        } else if (sortOption.startsWith('filter:')) {
            filterPartParam = sortOption.replace('filter:', '');
        }

        try {
            const queryParams = new URLSearchParams({
                userId: userId || '',
                keyword: keyword,
                sort: sortParam,
                filterPart: filterPartParam
            });
            const url = clanId
                ? `/api/clans/${clanId}/bands?${queryParams.toString()}`
                : `/api/bands?${queryParams.toString()}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setJamRooms(data);
            }
        } catch (error) {
            console.error("Failed to fetch jam rooms", error);
        }
    };

    useEffect(() => {
        fetchJamRooms(searchTerm);
    }, [clanId, sortOption]);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            fetchJamRooms(searchTerm);
        }
    };

    const handleJoin = async (room: JamRoom, role: JamRole) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert("로그인이 필요합니다.");
            return;
        }

        if (role.isCurrentUser) {
            handleCancel(room, role);
            return;
        }

        try {
            const response = await fetch('/api/bands/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bnNo: room.id,
                    userId: userId,
                    sessionNo: role.sessionNo,
                    sessionTypeCd: role.sessionTypeCd
                }),
            });

            if (response.ok) {
                showAlert("참여가 완료되었습니다!");
                fetchJamRooms(searchTerm); // Refresh list
            } else {
                const errorData = await response.text();
                showAlert(`참여 실패: ${errorData}`);
            }
        } catch (error) {
            console.error("Join failed", error);
            showAlert("참여 중 오류가 발생했습니다.");
        }
    };

    const handleCancel = (room: JamRoom, role: JamRole) => {
        showConfirm("정말 참여를 취소하시겠습니까?", async () => {
            if (!userId) return;
            try {
                const response = await fetch('/api/bands/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bnNo: room.id,
                        userId: userId,
                        sessionNo: role.sessionNo,
                        sessionTypeCd: role.sessionTypeCd
                    }),
                });

                if (response.ok) {
                    showAlert("참여가 취소되었습니다.");
                    fetchJamRooms(searchTerm);
                } else {
                    const errorData = await response.text();
                    showAlert(`취소 실패: ${errorData}`);
                }
            } catch (error) {
                console.error("Cancel failed", error);
                showAlert("취소 중 오류가 발생했습니다.");
            }
        });
    };

    const handleReserve = async (room: JamRoom, role: JamRole) => {
        if (!userId) {
            showAlert("로그인이 필요합니다.");
            return;
        }
        try {
            const response = await fetch('/api/bands/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bnNo: String(room.id),
                    sessionTypeCd: role.sessionTypeCd,
                    userId
                }),
            });
            if (response.ok) {
                showAlert('예약이 완료되었습니다.');
                fetchJamRooms(searchTerm);
            } else {
                const err = await response.text();
                showAlert(`예약 실패: ${err}`);
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };

    const fetchReservations = async (bnNo: number, sessionTypeCd: string, sessionName: string) => {
        try {
            const res = await fetch(`/api/bands/${bnNo}/reservations?sessionTypeCd=${sessionTypeCd}`);
            if (res.ok) {
                const data = await res.json();
                setRsvModal({
                    isOpen: true,
                    bnNo,
                    sessionTypeCd,
                    sessionName,
                    reservations: data.reservations || [],
                });
            }
        } catch (e) {
            showAlert('예약 목록을 불러오지 못했습니다.');
        }
    };

    const handleCancelReservation = async (rsvNo: number) => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/bands/reserve/${rsvNo}?userId=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                // 삭제 후 재조회
                const updated = await fetch(`/api/bands/${rsvModal.bnNo}/reservations?sessionTypeCd=${rsvModal.sessionTypeCd}`);
                if (updated.ok) {
                    const data = await updated.json();
                    setRsvModal(prev => ({ ...prev, reservations: data.reservations || [] }));
                }
                fetchJamRooms(searchTerm);
            } else {
                const err = await res.text();
                showAlert(`삭제 실패: ${err}`);
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };



    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2">
                <div className="flex items-center gap-2">
                    {clanId && (
                        <button onClick={() => navigate(-1)} className="text-[#052c42]">
                            <FaChevronLeft size={24} />
                        </button>
                    )}
                    <SectionTitle as="h1" className="!mt-0 !mb-0">{clanId ? "클랜 합주방" : "자유 합주방"}</SectionTitle>
                </div>
                {(!clanId || userRole === '01' || userRole === '02') && (
                    <button
                        onClick={() => navigate(clanId ? `/main/clan/jam/${clanId}/create` : `/main/jam/create`)}
                        className="bg-[#00BDF8] text-white text-[14px] px-4 py-1.5 rounded-full font-bold shadow-sm"
                    >
                        방 생성
                    </button>
                )}
            </div>

            {/* Search & Filter */}
            <div className="px-4 mb-4 space-y-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-[#00BDF8]" />
                    </div>
                    <input
                        type="text"
                        placeholder="방 제목, 곡명, 아티스트 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-[#00BDF8] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                    />
                </div>
                <div className="flex justify-between items-center">
                    {clanId ? (
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'board' ? 'bg-[#00BDF8] text-white font-bold shadow-sm' : 'text-gray-500'}`}
                            >
                                보드
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#00BDF8] text-white font-bold shadow-sm' : 'text-gray-500'}`}
                            >
                                테이블
                            </button>
                        </div>
                    ) : (
                        <div></div>
                    )}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border-none bg-transparent text-sm text-[#003C48] font-bold outline-none cursor-pointer"
                    >
                        <option value="sort:latest">최신순</option>
                        <option value="sort:emptyAsc">빈 세션 ▲</option>
                        <option value="sort:emptyDesc">빈 세션 ▼</option>
                        {sessionCodes.map((code) => (
                            <option key={code.commDtlCd} value={`filter:${code.commDtlCd}`}>
                                {code.commDtlNm}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 bg-gray-50 py-4">
                {viewMode === 'table' ? (
                    jamRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p className="text-lg mb-2">아직 개설된 합주방이 없어요. 🎸</p>
                            <p className="text-sm">첫 번째 합주방을 만들어보세요!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto min-h-[500px]">
                            <table className="w-full text-center border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-[#003C48] border-b-2 border-[#00BDF8] text-[11px] font-bold">
                                        <th className="py-2 px-2 text-left sticky left-0 z-20 bg-white border-b-2 border-[#00BDF8] min-w-[100px]">제목 및 아티스트</th>
                                        {sessionCodes.map((code) => (
                                            <th key={code.commDtlCd} className="py-2 px-0.5 min-w-[45px] whitespace-normal break-words leading-tight">
                                                {code.commDtlNm}
                                            </th>
                                        ))}

                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {jamRooms.map((room) => {
                                        const safeRoles = room.roles || [];

                                        // Helper to aggregate roles by Session Code
                                        const getRoleStatus = (sessionCode: string) => {
                                            const roles = safeRoles.filter(r => r.sessionTypeCd === sessionCode);
                                            if (roles.length === 0) return "-";
                                            return roles.map((r, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <div>
                                                        {r.status === 'occupied' && r.user ? r.user : "공석"}
                                                    </div>
                                                    {r.reservedUsers && r.reservedUsers.length > 0 && (
                                                        <div className="text-[9px] text-[#FFB74D] font-bold mt-0.5 leading-tight">
                                                            {r.reservedUsers.map((nick, nIdx) => (
                                                                <div key={nIdx}>({nick})</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ));
                                        };

                                        return (
                                            <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-2 px-2 text-left sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[100px]">
                                                    <div
                                                        className="font-bold text-[#003C48] cursor-pointer hover:underline text-xs truncate max-w-[120px]"
                                                        onClick={() => handleRoomClick(room)}
                                                    >
                                                        {room.title}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{room.songTitle}</div>
                                                    <div className="text-[10px] text-gray-400 truncate max-w-[120px]">{room.artist}</div>
                                                </td>
                                                {sessionCodes.map((code) => (
                                                    <td key={code.commDtlCd} className="py-2 px-0.5 text-[#003C48]">
                                                        {getRoleStatus(code.commDtlCd)}
                                                    </td>
                                                ))}

                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    // Board View (Original List)
                    jamRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p className="text-lg mb-2">아직 개설된 합주방이 없어요. 🎸</p>
                            <p className="text-sm">첫 번째 합주방을 만들어보세요!</p>
                        </div>
                    ) : (
                        jamRooms.map((room) => {
                            // const isJoinedInRoom = room.roles.some(r => r.isCurrentUser); // Removed for multi-session support
                            return (
                                <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    {/* Card Header */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                {/* Lock Icon checks room.secret (bnPasswdFg === 'Y') */}
                                                {room.secret && <FaLock className="text-[#003C48]" size={14} />}
                                                <h3
                                                    className="body-room-title cursor-pointer hover:underline !text-[#003C48]"
                                                    onClick={() => handleRoomClick(room)}
                                                >
                                                    {room.title}
                                                </h3>
                                            </div>
                                            <FaInfoCircle
                                                className="text-gray-400 hover:text-[#00BDF8] cursor-pointer"
                                                size={16}
                                                onClick={(e) => openDescModal(e, room)}
                                            />
                                        </div>

                                        <div className="body-room-subtitle">
                                            {room.artist} - {room.songTitle}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gray-50 mb-3"></div>

                                    {/* Roles Grid */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        {room.roles.map((role, idx) => (
                                            <div key={idx} className="flex flex-col">
                                                <span className="text-[#003C48] font-bold text-xs mb-1">{role.part}</span>

                                                {/* Member Status */}
                                                <div className="mb-2 flex items-center justify-between w-full">
                                                    {role.status === 'occupied' ? (
                                                        <span className="text-[#003C48] text-[13px] font-medium">{role.user}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">공석</span>
                                                    )}
                                                    {/* 예약 배지 */}
                                                    {role.status === 'occupied' && (role.reservedCount || 0) > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fetchReservations(room.id, role.sessionTypeCd || '', role.part);
                                                            }}
                                                            className="bg-red-400 text-white text-[9px] px-1 rounded-full font-bold"
                                                        >
                                                            예약 {role.reservedCount}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <div>
                                                    {room.status === 'E' ? (
                                                        <button
                                                            disabled
                                                            className="w-full bg-gray-500 text-white text-xs font-bold py-1.5 rounded-lg shadow-sm cursor-not-allowed"
                                                        >
                                                            합주종료
                                                        </button>
                                                    ) : room.isConfirmed ? (
                                                        <button
                                                            disabled
                                                            className="w-full bg-gray-400 text-white text-xs font-bold py-1.5 rounded-lg shadow-sm cursor-not-allowed"
                                                        >
                                                            확정완료
                                                        </button>
                                                    ) : role.status === 'empty' ? (
                                                        <button
                                                            onClick={() => handleJoin(room, role)}
                                                            className="w-full text-[#003C48] text-xs font-bold py-1.5 rounded-lg shadow-sm transition-colors bg-[#EFF1F3] hover:bg-gray-200"
                                                        >
                                                            참여
                                                        </button>
                                                    ) : role.isCurrentUser ? (
                                                        <button
                                                            onClick={() => handleJoin(room, role)}
                                                            className="w-full bg-[#FF8A80] text-white text-xs font-bold py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                                                        >
                                                            취소
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReserve(room, role)}
                                                            className="w-full bg-[#FFB74D] text-white text-xs font-bold py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                                                        >
                                                            예약
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* Password Modal */}
            {
                passwordModal.isOpen && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#003C48] mb-4 text-center">비밀번호 입력</h3>
                            <input
                                type="password"
                                value={passwordModal.password}
                                onChange={(e) => setPasswordModal(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#00BDF8] focus:outline-none mb-6 text-center text-lg"
                                placeholder="비밀번호를 입력하세요"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') verifyPasswordAndNavigate();
                                }}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={verifyPasswordAndNavigate}
                                    className="flex-1 py-3 text-white font-bold bg-[#00BDF8] rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-200"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Description Modal */}
            {
                descModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDescModal(prev => ({ ...prev, isOpen: false }))}>
                        <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                            <h3 className="body-modal-title">{descModal.title}</h3>
                            <div className="text-gray-600 text-sm mb-6 whitespace-pre-wrap min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar leading-relaxed">
                                {descModal.description}
                            </div>
                            <button
                                onClick={() => setDescModal(prev => ({ ...prev, isOpen: false }))}
                                className="bottom-btn-primary"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )
            }

            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />

            {/* 예약자 목록 팔업 */}
            {rsvModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-lg">
                        <h2 className="text-base font-bold text-[#003C48] mb-3 text-center">
                            {rsvModal.sessionName} 예약 목록
                        </h2>

                        {rsvModal.reservations.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">예약자가 없습니다.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-gray-400 border-b pb-1">
                                    <span>순번</span>
                                    <span>닉네임</span>
                                    <span>세션</span>
                                    <span className="text-right">삭제</span>
                                </div>
                                {rsvModal.reservations.map((rsv, idx) => (
                                    <div key={rsv.rsvNo} className="grid grid-cols-4 gap-1 text-xs items-center">
                                        <span className="text-[#00BDF8] font-bold">{idx + 1}</span>
                                        <span className="truncate">{rsv.userNickNm}</span>
                                        <span className="text-gray-500 truncate">{rsv.sessionName}</span>
                                        {(userRole === '01' || userRole === '02' || rsv.userId === userId) ? (
                                            <button
                                                onClick={() => handleCancelReservation(rsv.rsvNo)}
                                                className="text-right text-[#FF8A80] font-bold text-[11px]"
                                            >
                                                삭제
                                            </button>
                                        ) : (
                                            <span />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setRsvModal(prev => ({ ...prev, isOpen: false }))}
                            className="mt-4 w-full bg-gray-100 text-gray-600 font-bold py-2 rounded-xl text-sm"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ClanJamList;
