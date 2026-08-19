import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaLock, FaMicrophone, FaGuitar, FaDrum, FaMusic, FaCheck, FaPlusCircle } from 'react-icons/fa';
import { GiGrandPiano } from 'react-icons/gi';
import { SlidersHorizontal, X } from 'lucide-react';
import CommonModal from '../components/common/CommonModal';
import DefaultProfile from '../components/common/DefaultProfile';

interface JamRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part: string;
    user?: string;
    status: 'empty' | 'occupied' | 'reserved';
    reservedCount?: number;
    isCurrentUser?: boolean;
    isCurrentUserReserved?: boolean;
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
    attachFilePath?: string;
    roles: JamRole[];
}

const ClanJamList: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const userId = localStorage.getItem('userId') || '';
    const currentUserNickNm = localStorage.getItem('userNickNm') || localStorage.getItem('userNm') || '';
    const [userRole, setUserRole] = useState<string>(''); // '01': Leader, '02': Executive

    const [jamRooms, setJamRooms] = useState<JamRoom[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortOption, setSortOption] = useState<string>('sort:latest');
    const [sessionCodes, setSessionCodes] = useState<{ commDtlCd: string; commDtlNm: string; commOrder: number }[]>([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // 참여하기 / 취소하기 바텀시트 모달 상태
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        mode: 'join' | 'cancel';
        room: JamRoom | null;
        selectedSessionNo: number | null;
        selectedSessionTypeCd: string | null;
        comment: string;
    }>({
        isOpen: false,
        mode: 'join',
        room: null,
        selectedSessionNo: null,
        selectedSessionTypeCd: null,
        comment: '',
    });

    // 비밀번호 입력 모달
    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        bnNo: 0,
        password: '',
    });

    // 상세 설명 모달
    const [descModal, setDescModal] = useState({
        isOpen: false,
        title: '',
        description: '',
    });

    // 공통 알림/확인 모달
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
                setJamRooms(data || []);
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

    const handleRoomClick = (room: JamRoom) => {
        if (room.secret) {
            setPasswordModal({
                isOpen: true,
                bnNo: room.id,
                password: '',
            });
        } else {
            if (clanId) {
                navigate(`/main/clan/jam/room/${room.id}`);
            } else {
                navigate(`/main/jam/room/${room.id}`);
            }
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
                if (clanId) {
                    navigate(`/main/clan/jam/room/${passwordModal.bnNo}`);
                } else {
                    navigate(`/main/jam/room/${passwordModal.bnNo}`);
                }
            } else {
                showAlert("비밀번호가 일치하지 않습니다.");
            }
        } catch (error) {
            console.error("Password verification failed", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    // 악기 아이콘 렌더링 헬퍼
    const renderInstrumentIcon = (part: string, className = "w-4 h-4") => {
        if (part.includes('보컬') || part.toLowerCase().includes('vocal')) return <FaMicrophone className={className} />;
        if (part.includes('리드') || part.includes('기타') || part.toLowerCase().includes('guitar')) return <FaGuitar className={className} />;
        if (part.includes('베이스') || part.toLowerCase().includes('bass')) return <FaGuitar className={className} />;
        if (part.includes('드럼') || part.toLowerCase().includes('drum')) return <FaDrum className={className} />;
        if (part.includes('키보드') || part.includes('건반') || part.toLowerCase().includes('piano')) return <GiGrandPiano className={className} />;
        return <FaMusic className={className} />;
    };

    // 모달 열기 (참여하기 or 취소하기)
    const openActionModal = (room: JamRoom, mode: 'join' | 'cancel') => {
        if (!userId) {
            showAlert("로그인이 필요합니다.");
            return;
        }

        // 기본 선택 세션 결정
        let defaultSessionNo: number | null = null;
        let defaultSessionTypeCd: string | null = null;

        if (mode === 'cancel') {
            const myRole = room.roles.find(r => r.isCurrentUser || r.isCurrentUserReserved || (currentUserNickNm && r.reservedUsers?.includes(currentUserNickNm)));
            if (myRole) {
                defaultSessionNo = myRole.sessionNo || null;
                defaultSessionTypeCd = myRole.sessionTypeCd || null;
            }
        } else {
            // 빈 세션 우선 선택
            const emptyRole = room.roles.find(r => r.status === 'empty');
            if (emptyRole) {
                defaultSessionNo = emptyRole.sessionNo || null;
                defaultSessionTypeCd = emptyRole.sessionTypeCd || null;
            } else if (room.roles.length > 0) {
                defaultSessionNo = room.roles[0].sessionNo || null;
                defaultSessionTypeCd = room.roles[0].sessionTypeCd || null;
            }
        }

        setActionModal({
            isOpen: true,
            mode,
            room,
            selectedSessionNo: defaultSessionNo,
            selectedSessionTypeCd: defaultSessionTypeCd,
            comment: '',
        });
    };

    // 세션 박스 클릭 시 토글 액션 (참여 / 참여취소 / 예약 / 예약취소)
    const handleSessionClick = (e: React.MouseEvent, room: JamRoom, role: JamRole) => {
        e.stopPropagation(); // 방 상세 이동 방지
        if (!userId) {
            showAlert("로그인이 필요합니다.");
            return;
        }

        const isClosed = room.isConfirmed || room.status === 'E';
        if (isClosed) {
            showAlert("이미 마감된 합주입니다.");
            return;
        }

        const isUserJoined = !!role.isCurrentUser;
        const isUserReserved = Boolean(
            role.isCurrentUserReserved ||
            (currentUserNickNm && role.reservedUsers?.includes(currentUserNickNm))
        );

        if (isUserJoined) {
            // 1. 내가 참여 중 ➡️ 참여 취소
            showConfirm(`'${role.part}' 세션 참여를 취소하시겠습니까?`, async () => {
                try {
                    const response = await fetch('/api/bands/cancel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: room.id,
                            userId: userId,
                            sessionNo: role.sessionNo,
                            sessionTypeCd: role.sessionTypeCd,
                        }),
                    });

                    if (response.ok) {
                        showAlert("참여가 취소되었습니다.");
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`취소 실패: ${err}`);
                    }
                } catch (err) {
                    showAlert("취소 중 오류가 발생했습니다.");
                }
            });
        } else if (isUserReserved) {
            // 2. 내가 예약(대기) 중 ➡️ 예약 취소
            showConfirm(`'${role.part}' 세션 예약을 취소하시겠습니까?`, async () => {
                try {
                    const res = await fetch(`/api/bands/${room.id}/reservations?sessionTypeCd=${role.sessionTypeCd}`);
                    if (res.ok) {
                        const data = await res.json();
                        const myRsv = (data.reservations || []).find((r: any) => r.userId === userId);
                        if (myRsv) {
                            await fetch(`/api/bands/reserve/${myRsv.rsvNo}?userId=${userId}`, { method: 'DELETE' });
                            showAlert("예약이 취소되었습니다.");
                            fetchJamRooms(searchTerm);
                        } else {
                            showAlert("예약 정보를 찾을 수 없습니다.");
                        }
                    }
                } catch (err) {
                    showAlert("취소 중 오류가 발생했습니다.");
                }
            });
        } else if (role.status === 'empty') {
            // 3. 빈 세션(공석) ➡️ 확인 confirm 팝업 후 즉시 참여
            showConfirm(`'${role.part}' 세션에 참여하시겠습니까?`, async () => {
                try {
                    const response = await fetch('/api/bands/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: room.id,
                            userId: userId,
                            sessionNo: role.sessionNo,
                            sessionTypeCd: role.sessionTypeCd,
                        }),
                    });

                    if (response.ok) {
                        showAlert("합주 참여가 완료되었습니다!");
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`참여 실패: ${err}`);
                    }
                } catch (e) {
                    console.error("Join failed", e);
                    showAlert("참여 중 오류가 발생했습니다.");
                }
            });
        } else {
            // 4. 타인이 참여 중 ➡️ 대기(예약) 신청
            showConfirm(`'${role.part}' 세션에 대기(예약)를 신청하시겠습니까?`, async () => {
                try {
                    const response = await fetch('/api/bands/reserve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: String(room.id),
                            sessionTypeCd: role.sessionTypeCd,
                            userId: userId,
                        }),
                    });

                    if (response.ok) {
                        showAlert("대기(예약) 등록이 완료되었습니다!");
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`예약 실패: ${err}`);
                    }
                } catch (err) {
                    showAlert("예약 중 오류가 발생했습니다.");
                }
            });
        }
    };

    // 모달 내 실행 버튼 클릭 처리
    const handleActionSubmit = async () => {
        if (!actionModal.room || !actionModal.selectedSessionNo) {
            showAlert("포지션을 선택해주세요.");
            return;
        }

        const selectedRole = actionModal.room.roles.find(r => r.sessionNo === actionModal.selectedSessionNo);
        if (!selectedRole) {
            showAlert("선택된 포지션 정보를 찾을 수 없습니다.");
            return;
        }

        if (actionModal.mode === 'join') {
            // 빈 세션인 경우 -> 참여 (Join)
            if (selectedRole.status === 'empty') {
                try {
                    const response = await fetch('/api/bands/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: actionModal.room.id,
                            userId: userId,
                            sessionNo: selectedRole.sessionNo,
                            sessionTypeCd: selectedRole.sessionTypeCd,
                        }),
                    });

                    if (response.ok) {
                        // 한마디를 입력했다면 합주 채팅방으로 전송
                        if (actionModal.comment && actionModal.comment.trim()) {
                            try {
                                await fetch('/api/chat/message', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        cnNo: actionModal.room.id,
                                        sndUserId: userId,
                                        msg: actionModal.comment.trim(),
                                        msgTypeCd: 'TEXT',
                                        roomType: 'BAND',
                                    }),
                                });
                            } catch (chatErr) {
                                console.error("Failed to send join comment to chat", chatErr);
                            }
                        }

                        showAlert("합주 참여가 완료되었습니다!");
                        setActionModal(prev => ({ ...prev, isOpen: false }));
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`참여 실패: ${err}`);
                    }
                } catch (e) {
                    console.error("Join failed", e);
                    showAlert("참여 중 오류가 발생했습니다.");
                }
            } else {
                // 이미 다른 사용자가 참여한 세션인 경우 -> 대기/예약 (Reserve)
                try {
                    const response = await fetch('/api/bands/reserve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: String(actionModal.room.id),
                            sessionTypeCd: selectedRole.sessionTypeCd,
                            userId: userId,
                        }),
                    });

                    if (response.ok) {
                        showAlert("대기(예약) 등록이 완료되었습니다!");
                        setActionModal(prev => ({ ...prev, isOpen: false }));
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`예약 실패: ${err}`);
                    }
                } catch (e) {
                    console.error("Reserve failed", e);
                    showAlert("예약 중 오류가 발생했습니다.");
                }
            }
        } else {
            // 취소하기 모드
            if (selectedRole.isCurrentUser) {
                // 본인이 참여 중인 세션 취소
                try {
                    const response = await fetch('/api/bands/cancel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bnNo: actionModal.room.id,
                            userId: userId,
                            sessionNo: selectedRole.sessionNo,
                            sessionTypeCd: selectedRole.sessionTypeCd,
                        }),
                    });

                    if (response.ok) {
                        showAlert("참여가 취소되었습니다.");
                        setActionModal(prev => ({ ...prev, isOpen: false }));
                        fetchJamRooms(searchTerm);
                    } else {
                        const err = await response.text();
                        showAlert(`취소 실패: ${err}`);
                    }
                } catch (e) {
                    console.error("Cancel failed", e);
                    showAlert("취소 중 오류가 발생했습니다.");
                }
            } else {
                // 예약 취소 처리
                try {
                    const res = await fetch(`/api/bands/${actionModal.room.id}/reservations?sessionTypeCd=${selectedRole.sessionTypeCd}`);
                    if (res.ok) {
                        const data = await res.json();
                        const myRsv = (data.reservations || []).find((r: any) => r.userId === userId);
                        if (myRsv) {
                            await fetch(`/api/bands/reserve/${myRsv.rsvNo}?userId=${userId}`, { method: 'DELETE' });
                            showAlert("예약이 취소되었습니다.");
                            setActionModal(prev => ({ ...prev, isOpen: false }));
                            fetchJamRooms(searchTerm);
                        } else {
                            showAlert("예약 내역을 찾을 수 없습니다.");
                        }
                    }
                } catch (e) {
                    showAlert("취소 처리 중 오류가 발생했습니다.");
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F9FC] font-['Pretendard'] pb-24 text-gray-900 selection:bg-[#00BDF8] selection:text-white">
            <div className="w-full max-w-lg mx-auto px-4 py-4 space-y-5">

                {/* ========================================================================= */}
                {/* 1 영역. 상단 환영 & 방 만들기 & 검색/필터 (피그마 100% 일치) */}
                {/* ========================================================================= */}
                <section className="space-y-4 pt-1">
                    {/* 상단 타이틀 & 방 만들기 버튼 */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                {clanId && (
                                    <button onClick={() => navigate(-1)} className="text-[#0B1114] p-1 -ml-1">
                                        <FaChevronLeft size={20} />
                                    </button>
                                )}
                                <h1 className="text-[24px] font-bold leading-[32px] text-[#0B1114] tracking-tight">
                                    {clanId ? "클랜 합주방" : "자유 합주방"}
                                </h1>
                            </div>
                            <p className="text-[14px] font-normal leading-[22px] text-[#0B1114]">
                                원하는 멤버와 자유롭게 합주해요!
                            </p>
                        </div>

                        {/* 방 만들기 버튼 */}
                        {(!clanId || userRole === '01' || userRole === '02') && (
                            <button
                                onClick={() => navigate(clanId ? `/main/clan/jam/${clanId}/create` : `/main/jam/create`)}
                                className="flex items-center gap-1.5 bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white text-[12px] font-bold px-3.5 py-2 rounded-full shadow-sm transition-all cursor-pointer shrink-0"
                            >
                                <FaPlusCircle size={13} />
                                <span>방 만들기</span>
                            </button>
                        )}
                    </div>

                    {/* 검색창 & 필터 버튼 Row */}
                    <div className="flex items-center gap-2.5">
                        {/* 둥근 검색 필드 */}
                        <div className="flex-1 relative h-[50px] bg-white rounded-full border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] flex items-center px-4">
                            <FaSearch className="text-[#00BDF8] mr-3 shrink-0" size={16} />
                            <input
                                type="text"
                                placeholder="방 제목, 아티스트, 곡명등을 검색해보세요."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full text-[14px] font-medium text-[#0B1114] placeholder-[#B8B8B8] bg-transparent outline-none"
                            />
                        </div>

                        {/* 필터 버튼 */}
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className="w-[50px] h-[50px] rounded-[24px] bg-white border border-[#E5E5E5] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-[#00BDF8] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shrink-0"
                            aria-label="필터 설정"
                        >
                            <SlidersHorizontal size={20} className="text-[#00BDF8]" />
                        </button>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 2 영역. 밴디콘 추천 합주 목록 */}
                {/* ========================================================================= */}
                <section className="space-y-3.5 pt-1">
                    <h2 className="text-[18px] font-bold leading-[26px] text-[#0B1114]">
                        밴디콘 추천 합주
                    </h2>

                    {jamRooms.length === 0 ? (
                        <div className="bg-white rounded-[12px] p-8 text-center text-gray-400 border border-[#E5E5E5] space-y-2">
                            <p className="text-base font-bold text-gray-700">개설된 합주방이 없습니다. 🎸</p>
                            <p className="text-xs text-gray-400">첫 번째 합주방을 직접 만들어보세요!</p>
                        </div>
                    ) : (
                        jamRooms.map((room) => {
                            const occupiedCount = room.roles.filter(r => r.status === 'occupied').length;
                            const totalCount = room.roles.length;
                            const isMyRoom = room.roles.some(r => r.isCurrentUser || r.isCurrentUserReserved || (currentUserNickNm && r.reservedUsers?.includes(currentUserNickNm)));
                            const isClosed = room.isConfirmed || room.status === 'E';

                            return (
                                <div
                                    key={room.id}
                                    className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 sm:p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.03)] space-y-4 transition-all hover:shadow-md"
                                >
                                    {/* 상단 뱃지(좌측) & 모집 인원(우측) */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-[2px] ${
                                                isClosed ? 'bg-gray-100 text-gray-500' : 'bg-[#EFF2F2] text-[#525252]'
                                            }`}>
                                                {isClosed ? '모집 마감' : '모집 중'}
                                            </span>

                                            {room.secret && (
                                                <FaLock size={12} className="text-gray-400" title="비공개 합주방" />
                                            )}
                                        </div>

                                        <span className="text-[12px] font-bold text-[#525252]">
                                            {occupiedCount}/{totalCount}명 모집 중
                                        </span>
                                    </div>

                                    {/* 합주 정보 (썸네일 + 방 제목 + 곡명/아티스트) */}
                                    <div
                                        onClick={() => handleRoomClick(room)}
                                        className="flex items-center gap-3.5 cursor-pointer group"
                                    >
                                        <div className="w-[64px] h-[64px] rounded-[16px] overflow-hidden bg-gray-100 shadow-[0_2px_6px_rgba(0,0,0,0.08)] shrink-0 flex items-center justify-center">
                                            {room.attachFilePath ? (
                                                <img
                                                    src={room.attachFilePath}
                                                    alt={room.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <DefaultProfile type="jam" iconSize={28} className="w-full h-full group-hover:scale-105 transition-transform" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <h3 className="text-[16px] font-bold leading-[20px] text-[#0B1114] truncate group-hover:text-[#00BDF8] transition-colors">
                                                {room.title}
                                            </h3>
                                            <p className="text-[12px] font-medium leading-[18px] text-[#737373] truncate min-h-[18px]">
                                                {room.songTitle && room.artist
                                                    ? `${room.songTitle} - ${room.artist}`
                                                    : room.songTitle || room.artist || ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 세션 목록 (간격을 줄여 6개 세션이 모바일에서도 스크롤 없이 노출 - 클릭 시 토글 액션) */}
                                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                                        {room.roles.map((role, idx) => {
                                            const isUserJoined = !!role.isCurrentUser;
                                            const isUserReserved = Boolean(role.isCurrentUserReserved || (currentUserNickNm && role.reservedUsers?.includes(currentUserNickNm)));
                                            const isEmpty = role.status === 'empty' && !isUserJoined;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={(e) => handleSessionClick(e, room, role)}
                                                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group/session hover:scale-105 active:scale-95 transition-transform"
                                                    title={
                                                        isUserJoined
                                                            ? '참여 취소'
                                                            : isUserReserved
                                                                ? '예약 취소'
                                                                : isEmpty
                                                                    ? '참여하기'
                                                                    : isClosed
                                                                        ? '마감'
                                                                        : '대기(예약)하기'
                                                    }
                                                >
                                                    {/* 악기 박스: 내가 참여(파랑), 내가 예약(주황), 타인 참여(차콜), 공석(파란테두리) */}
                                                    <div className={`w-[43px] sm:w-[46px] h-[41px] sm:h-[43px] rounded-[10px] flex flex-col items-center justify-center gap-0.5 transition-all ${
                                                        isUserJoined
                                                            ? 'bg-[#00BDF8] text-white shadow-xs'
                                                            : isUserReserved
                                                                ? 'bg-[#F4A340] text-white shadow-xs'
                                                                : isEmpty
                                                                    ? 'bg-white border border-[#00BDF8] text-[#0098CC]'
                                                                    : 'bg-[#2C373C] text-white shadow-xs'
                                                    }`}>
                                                        {renderInstrumentIcon(role.part, "w-3.5 h-3.5")}
                                                        <span className="text-[10px] font-medium leading-none truncate max-w-[38px] sm:max-w-[40px]">
                                                            {role.part}
                                                        </span>
                                                    </div>

                                                    {/* 하단 상태 라벨 */}
                                                    <span className={`text-[10px] font-bold text-center leading-tight ${
                                                        isUserJoined
                                                            ? 'text-[#00BDF8]'
                                                            : isUserReserved
                                                                ? 'text-[#F4A340]'
                                                                : isEmpty
                                                                    ? 'text-[#0098CC]'
                                                                    : isClosed
                                                                        ? 'text-gray-400'
                                                                        : 'text-[#2C373C]'
                                                    }`}>
                                                        {isUserJoined
                                                            ? '참여 중'
                                                            : isUserReserved
                                                                ? '예약 중'
                                                                : isEmpty
                                                                    ? '참여 가능'
                                                                    : isClosed
                                                                        ? '마감'
                                                                        : '대기 가능'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </div>

            {/* ========================================================================= */}
            {/* 참여하기 / 취소하기 바텀시트 모달 (2번째 캡처 화면 100% 일치) */}
            {/* ========================================================================= */}
            {actionModal.isOpen && actionModal.room && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center animate-fadeIn"
                    onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-[24px] p-5 pb-8 space-y-5 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 상단 핸들 바 */}
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

                        {/* 합주 정보 요약 */}
                        <div className="flex items-center gap-3.5 pb-2">
                            <div className="w-[56px] h-[56px] rounded-[16px] overflow-hidden bg-gray-100 shadow-xs shrink-0 flex items-center justify-center">
                                {actionModal.room.attachFilePath ? (
                                    <img
                                        src={actionModal.room.attachFilePath}
                                        alt={actionModal.room.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <DefaultProfile type="jam" iconSize={24} className="w-full h-full" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[16px] font-bold text-[#0B1114] truncate">
                                    {actionModal.room.title}
                                </h3>
                                <p className="text-[12px] font-medium text-[#737373] truncate mt-0.5 min-h-[18px]">
                                    {actionModal.room.songTitle && actionModal.room.artist
                                        ? `${actionModal.room.songTitle} - ${actionModal.room.artist}`
                                        : actionModal.room.songTitle || actionModal.room.artist || ''}
                                </p>
                            </div>
                        </div>

                        {/* 포지션 선택 리스트 */}
                        <div className="space-y-2.5">
                            <h4 className="text-[14px] font-bold text-[#0B1114]">
                                {actionModal.mode === 'join' ? '참여할 포지션 선택' : '취소할 포지션 선택'}
                            </h4>

                            <div className="space-y-2 border-t border-b border-gray-100 py-2">
                                {actionModal.room.roles
                                    .filter(role => {
                                        if (actionModal.mode === 'cancel') {
                                            return role.isCurrentUser || role.isCurrentUserReserved;
                                        }
                                        return true;
                                    })
                                    .map((role) => {
                                        const isSelected = actionModal.selectedSessionNo === role.sessionNo;
                                        const isEmpty = role.status === 'empty';
                                        const isUserJoined = role.isCurrentUser;
                                        const isUserReserved = Boolean(role.isCurrentUserReserved || (currentUserNickNm && role.reservedUsers?.includes(currentUserNickNm)));

                                        return (
                                            <div
                                                key={role.sessionNo}
                                                onClick={() => setActionModal(prev => ({
                                                    ...prev,
                                                    selectedSessionNo: role.sessionNo || null,
                                                    selectedSessionTypeCd: role.sessionTypeCd || null,
                                                }))}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                                    isSelected ? 'bg-gray-50 border border-gray-300' : 'hover:bg-gray-50/60'
                                                }`}
                                            >
                                                {/* 좌측: 라디오 아이콘 + 악기 아이콘 + 포지션명 및 인원 */}
                                                <div className="flex items-center gap-3">
                                                    {/* 라디오 서클 */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? 'border-[#0B1114] bg-[#0B1114]' : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>

                                                    {/* 악기 아이콘 */}
                                                    <div className="text-gray-600">
                                                        {renderInstrumentIcon(role.part, "w-4 h-4 text-gray-700")}
                                                    </div>

                                                    <div>
                                                        <span className="text-[14px] font-bold text-[#0B1114] block">
                                                            {role.part}
                                                        </span>
                                                        <span className="text-[11px] font-normal text-gray-500">
                                                            현재 {role.status === 'occupied' ? '1/1명' : '0/1명'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 우측: 상태 뱃지 */}
                                                <div>
                                                    {actionModal.mode === 'cancel' ? (
                                                        isUserJoined ? (
                                                            <span className="text-[11px] font-bold px-2 py-1 rounded bg-red-50 text-red-500">
                                                                참여 중
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold px-2 py-1 rounded bg-orange-50 text-[#F4A340]">
                                                                예약 중
                                                            </span>
                                                        )
                                                    ) : isUserJoined ? (
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-[#E6F8FE] text-[#00BDF8]">
                                                            참여 중
                                                        </span>
                                                    ) : isUserReserved ? (
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-orange-50 text-[#F4A340]">
                                                            예약 중
                                                        </span>
                                                    ) : isEmpty ? (
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                            참여가능
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                            대기가능
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* 한마디 (선택) - 참여하기 모드이며 빈 공석(참여가능) 세션을 선택했을 때만 표시 */}
                        {actionModal.mode === 'join' && actionModal.room?.roles.find(r => r.sessionNo === actionModal.selectedSessionNo)?.status === 'empty' && (
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-[#0B1114]">
                                    한마디 <span className="text-gray-400 font-normal">(선택)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={actionModal.comment}
                                    onChange={(e) => setActionModal(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="간단한 인사나 각오를 남겨보세요."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00BDF8] resize-none"
                                />
                            </div>
                        )}

                        {/* 실행 버튼 */}
                        <div className="space-y-2 pt-1">
                            <button
                                onClick={handleActionSubmit}
                                className={`w-full py-3.5 rounded-xl font-bold text-[15px] shadow-sm active:scale-[0.99] transition-all cursor-pointer ${
                                    actionModal.mode === 'join'
                                        ? 'bg-[#2C373C] hover:bg-[#1E2024] text-white'
                                        : 'bg-[#FF6B6B] hover:bg-red-600 text-white'
                                }`}
                            >
                                {actionModal.mode === 'join' ? '참여하기' : '취소하기'}
                            </button>

                            <p className="text-center text-[12px] text-gray-400 font-medium">
                                방장 승인시 참여가 확정됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 필터 / 정렬 모달 */}
            {/* ========================================================================= */}
            {isFilterModalOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center animate-fadeIn"
                    onClick={() => setIsFilterModalOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-[24px] p-6 space-y-4 shadow-2xl animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-[#0B1114]">정렬 및 필터</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 mb-2">정렬 기준</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: '최신순', value: 'sort:latest' },
                                        { label: '빈 세션 적은 순', value: 'sort:emptyAsc' },
                                        { label: '빈 세션 많은 순', value: 'sort:emptyDesc' },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setSortOption(item.value);
                                                setIsFilterModalOpen(false);
                                            }}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                sortOption === item.value
                                                    ? 'bg-[#00BDF8] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 mb-2">세션별 모아보기</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {sessionCodes.map((code) => (
                                        <button
                                            key={code.commDtlCd}
                                            onClick={() => {
                                                setSortOption(`filter:${code.commDtlCd}`);
                                                setIsFilterModalOpen(false);
                                            }}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                                sortOption === `filter:${code.commDtlCd}`
                                                    ? 'bg-[#00BDF8] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {code.commDtlNm}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 비밀번호 입력 모달 */}
            {passwordModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-[#0B1114] text-center">비밀번호 입력</h3>
                        <input
                            type="password"
                            value={passwordModal.password}
                            onChange={(e) => setPasswordModal(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00BDF8] focus:outline-none text-center text-lg"
                            placeholder="비밀번호를 입력하세요"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') verifyPasswordAndNavigate();
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPasswordModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200"
                            >
                                취소
                            </button>
                            <button
                                onClick={verifyPasswordAndNavigate}
                                className="flex-1 py-3 text-white font-bold bg-[#00BDF8] rounded-xl hover:bg-[#00a8e0]"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 상세 설명 모달 */}
            {descModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setDescModal(prev => ({ ...prev, isOpen: false }))}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-[#0B1114]">{descModal.title}</h3>
                        <div className="text-gray-600 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                            {descModal.description}
                        </div>
                        <button
                            onClick={() => setDescModal(prev => ({ ...prev, isOpen: false }))}
                            className="w-full py-3 bg-[#00BDF8] text-white font-bold rounded-xl hover:bg-[#00a8e0]"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* 공통 Alert / Confirm 모달 */}
            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default ClanJamList;
