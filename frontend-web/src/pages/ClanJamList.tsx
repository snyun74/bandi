import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaLock } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface JamRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part: string;
    user?: string;
    status: 'empty' | 'occupied' | 'reserved';
    reservedCount?: number;
    isCurrentUser?: boolean;
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



    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="text-gray-600">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">{clanId ? "클랜 합주방" : "자유 합주방"}</h1>
                </div>
                {(!clanId || userRole === '01' || userRole === '02') && (
                    <button
                        onClick={() => navigate(clanId ? `/main/clan/jam/${clanId}/create` : `/main/jam/create`)}
                        className="bg-[#00BDF8] text-white text-sm px-4 py-1.5 rounded-full font-bold shadow-sm"
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
                        placeholder="방 제목으로 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-[#00BDF8] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                    />
                </div>
                <div className="flex justify-between items-center">
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
                {jamRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p className="text-lg mb-2">아직 개설된 합주방이 없어요. 🎸</p>
                        <p className="text-sm">첫 번째 합주방을 만들어보세요!</p>
                    </div>
                ) : (
                    jamRooms.map((room) => {
                        const isJoinedInRoom = room.roles.some(r => r.isCurrentUser);
                        return (
                            <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                {/* Card Header */}
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        {room.status && room.status !== 'N' && <FaLock className="text-[#003C48]" size={14} />}
                                        <h3
                                            className="text-[#003C48] font-bold text-base cursor-pointer hover:underline"
                                            onClick={() => navigate(`/main/clan/jam/room/${room.id}`)}
                                        >
                                            {room.title}
                                        </h3>
                                    </div>
                                    <div className="text-[#00BDF8] font-bold text-sm">
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
                                            <div className="mb-2">
                                                {role.status === 'occupied' ? (
                                                    <span className="text-[#FF8A80] text-sm font-medium">{role.user}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">공석</span>
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
                                                        disabled={isJoinedInRoom}
                                                        className={`w-full text-[#003C48] text-xs font-bold py-1.5 rounded-lg shadow-sm transition-colors ${isJoinedInRoom ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#EFF1F3] hover:bg-gray-200'}`}
                                                    >
                                                        {isJoinedInRoom ? '참여불가' : '참여'}
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
                                                        disabled
                                                        className="w-full bg-[#00BDF8] text-white text-xs font-bold py-1.5 rounded-lg shadow-sm opacity-50 cursor-default"
                                                    >
                                                        참여완료
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div >
    );
};

export default ClanJamList;
