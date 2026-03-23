import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMicrophone, FaGuitar, FaDrum, FaCrown, FaMinusCircle, FaRegEdit, FaUnlink } from 'react-icons/fa';
import { GiGrandPiano } from "react-icons/gi";
import SectionTitle from '../components/common/SectionTitle';
import CommonModal from '../components/common/CommonModal';

interface JamRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part: string;
    user?: string;
    status: 'empty' | 'occupied' | 'reserved';
    isCurrentUser?: boolean;
    isBandLeader?: boolean;
    userId?: string;
    offImgUrl?: string;
    onImgUrl1?: string;
    onImgUrl2?: string;
    reservedCount?: number;
}

interface BandDetail {
    id: number;
    title: string;
    songTitle: string;
    artist: string;
    description: string;
    isSecret: boolean;
    isLeader: boolean;
    isConfirmed: boolean;
    status: string;
    canManage: boolean;
    imgUrl?: string;
    roles: JamRole[];
}

const ClanJamDetail: React.FC = () => {
    const navigate = useNavigate();
    const { jamId } = useParams<{ jamId: string }>();
    const userId = localStorage.getItem('userId');
    const [bandDetail, setBandDetail] = useState<BandDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', desc: '', previewUrl: '' });
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // 예약 팝업 상태 (특정 세션 내역 조회용 추가)
    const [rsvModal, setRsvModal] = useState<{
        isOpen: boolean;
        reservations: { rsvNo: number; userId: string; userNickNm: string; sessionName: string }[];
        currentSessionTypeCd?: string;
    }>({ isOpen: false, reservations: [] });




    const handleDelete = () => {
        showConfirm("정말 합주방을 삭제하시겠습니까?", async () => {
            try {
                const response = await fetch(`/api/bands/${jamId}?userId=${userId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    showAlert("합주방이 삭제되었습니다.");
                    navigate(-1); // Go back
                } else {
                    const errorMsg = await response.text();
                    showAlert(errorMsg || "삭제 실패");
                }
            } catch (error) {
                console.error("Failed to delete band", error);
                showAlert("오류가 발생했습니다.");
            }
        });
    };

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showAlert = (message: string) => {
        setModalConfig({ isOpen: true, type: 'alert', message, onConfirm: closeModal });
    };

    // 예약 기능
    const handleReserve = async (role: JamRole) => {
        if (!userId || !bandDetail) return;
        try {
            const response = await fetch('/api/bands/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bnNo: String(bandDetail.id),
                    sessionTypeCd: role.sessionTypeCd,
                    userId
                }),
            });
            if (response.ok) {
                showAlert('예약이 완료되었습니다.');
                const res = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                if (res.ok) setBandDetail(await res.json());
            } else {
                const err = await response.text();
                showAlert(`예약 실패: ${err}`);
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };

    const fetchReservations = async (sessionTypeCd?: string) => {
        if (!jamId) return;
        try {
            const url = sessionTypeCd
                ? `/api/bands/${jamId}/reservations?sessionTypeCd=${sessionTypeCd}`
                : `/api/bands/${jamId}/reservations`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRsvModal({
                    isOpen: true,
                    reservations: data.reservations || [],
                    currentSessionTypeCd: sessionTypeCd,
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
                const url = rsvModal.currentSessionTypeCd
                    ? `/api/bands/${jamId}/reservations?sessionTypeCd=${rsvModal.currentSessionTypeCd}`
                    : `/api/bands/${jamId}/reservations`;
                const updated = await fetch(url);
                if (updated.ok) {
                    const data = await updated.json();
                    setRsvModal(prev => ({ ...prev, reservations: data.reservations || [] }));
                }
                // 정보 새로고침
                const bandRes = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                if (bandRes.ok) setBandDetail(await bandRes.json());
            } else {
                const err = await res.text();
                showAlert(`삭제 실패: ${err}`);
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        const fetchBandDetail = async () => {
            if (!jamId || !userId) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBandDetail(data);
                } else {
                    const errorMsg = await response.text();
                    setModalConfig({
                        isOpen: true,
                        type: 'alert',
                        message: errorMsg || "합주 정보를 불러올 수 없습니다.",
                        onConfirm: () => {
                            closeModal();
                            navigate(-1);
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch band detail", error);
                showAlert("오류가 발생했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBandDetail();
    }, [jamId, userId, navigate]);

    const getFallbackIcon = (part: string, bgUrl?: string) => {
        if (bgUrl) return null;

        if (part.includes('보컬')) return <FaMicrophone size={32} className="text-[#00BDF8] mb-2" />;
        if (part.includes('기타')) return <FaGuitar size={32} className="text-[#00BDF8] mb-2" />;
        if (part.includes('베이스')) return <FaGuitar size={32} className="text-[#00BDF8] mb-2" />; // Fallback
        if (part.includes('드럼')) return <FaDrum size={32} className="text-[#00BDF8] mb-2" />;
        if (part.includes('키보드') || part.includes('건반')) return <GiGrandPiano size={32} className="text-[#00BDF8] mb-2" />;
        return <div className="w-8 h-8 bg-gray-200 rounded-full mb-2" />;
    };


    const handleConfirmToggle = async () => {
        if (!bandDetail || !bandDetail.canManage) return;

        const newStatus = bandDetail.isConfirmed ? 'N' : 'Y';

        if (newStatus === 'Y') {
            const isFull = bandDetail.roles.every(r => r.status === 'occupied');
            if (!isFull) {
                showAlert("모든 세션이 참여되어야 확정할 수 있습니다.");
                return;
            }
        }

        const actionText = bandDetail.isConfirmed ? "미확정 상태로 변경" : "확정";

        showConfirm(`${actionText}하시겠습니까?`, async () => {
            try {
                const response = await fetch(`/api/bands/${bandDetail.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, status: newStatus })
                });

                if (response.ok) {
                    setBandDetail(prev => prev ? { ...prev, isConfirmed: newStatus === 'Y' } : null);
                    showAlert(newStatus === 'Y' ? "확정이 완료되었습니다." : "미확정 상태로 변경되었습니다.");
                } else {
                    showAlert("상태 변경에 실패했습니다.");
                }
            } catch (error) {
                console.error("Failed to update status", error);
                showAlert("오류가 발생했습니다.");
            }
        });
    };

    const handleJoin = async (role: JamRole) => {
        if (!userId || !bandDetail) return;

        // Multi-session check logic is removed in backend, so frontend just sends join request
        try {
            const response = await fetch('/api/bands/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bnNo: bandDetail.id,
                    userId: userId,
                    sessionNo: role.sessionNo,
                    sessionTypeCd: role.sessionTypeCd
                }),
            });

            if (response.ok) {
                showAlert("참여가 완료되었습니다!");
                // Refresh
                const res = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                if (res.ok) setBandDetail(await res.json());
            } else {
                const error = await response.text();
                showAlert(`참여 실패: ${error}`);
            }
        } catch (error) {
            console.error("Join failed", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    const handleCancelSession = (role: JamRole) => {
        showConfirm("참여를 취소하시겠습니까?", async () => {
            if (!userId || !bandDetail) return;
            try {
                const response = await fetch('/api/bands/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bnNo: bandDetail.id,
                        userId: userId,
                        sessionNo: role.sessionNo,
                        sessionTypeCd: role.sessionTypeCd
                    }),
                });

                if (response.ok) {
                    showAlert("취소되었습니다.");
                    // Refresh
                    const res = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                    if (res.ok) setBandDetail(await res.json());
                } else {
                    const error = await response.text();
                    showAlert(`취소 실패: ${error}`);
                }
            } catch (error) {
                console.error("Cancel failed", error);
                showAlert("오류가 발생했습니다.");
            }
        });
    };

    const handleKick = (role: JamRole) => {
        showConfirm("정말로 강제탈퇴시키겠습니까?", async () => {
            if (!bandDetail?.id || !userId) return;
            try {
                // Find targetuserId from somewhere? 
                // Wait, role.user is nickname. We need target USER ID. 
                // The current API/DTO might not have target user ID in roles list?
                // Checking Interface... JamRole has 'user' (nickname). 
                // WE NEED TO UPDATE DTO to include userId.

                // Assuming we can't do it right now without DTO change. 
                // But wait, the backend kickBandMember needs targetUserId.
                // Let's check DTO first. If DTO update is needed, we must do it.
                // For now, I'll write the fetch call optimistically assuming I will update DTO next.

                const response = await fetch('/api/bands/kick', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bnNo: bandDetail.id,
                        requesterId: userId,
                        targetUserId: role.userId, // We need this field!
                        sessionNo: role.sessionNo,
                        sessionTypeCd: role.sessionTypeCd
                    })
                });

                if (response.ok) {
                    showAlert("강제 탈퇴 처리되었습니다.");
                    // Refresh
                    const res = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBandDetail(data);
                    }
                } else {
                    const error = await response.text();
                    showAlert(`강제 탈퇴 실패: ${error}`);
                }
            } catch (error) {
                console.error("Kick failed", error);
                showAlert("오류가 발생했습니다.");
            }
        });
    };

    const handleEndJam = () => {
        showConfirm("합주를 종료하시겠습니까?\n(종료시 합주방은 보이지 않습니다.)", async () => {
            if (!bandDetail?.id || !userId) return;
            try {
                const response = await fetch(`/api/bands/${bandDetail.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, status: 'E' })
                });

                if (response.ok) {
                    showAlert("합주가 종료되었습니다.");
                    navigate(-1);
                } else {
                    const error = await response.text();
                    showAlert(`합주 종료 실패: ${error}`);
                }
            } catch (error) {
                console.error("End Jam failed", error);
                showAlert("오류가 발생했습니다.");
            }
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


    const handleEditClick = () => {
        if (!bandDetail) return;
        setEditForm({
            title: bandDetail.title || '',
            desc: bandDetail.description || '',
            previewUrl: bandDetail.imgUrl || ''
        });
        setSelectedFile(null);
        setIsEditModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setEditForm(prev => ({
                ...prev,
                previewUrl: URL.createObjectURL(file)
            }));
        }
    };

    const handleUpdateBand = async () => {
        if (!jamId || !userId) return;

        const formData = new FormData();
        const updateData = {
            userId: userId,
            title: editForm.title,
            description: editForm.desc
        };

        formData.append('data', new Blob([JSON.stringify(updateData)], { type: 'application/json' }));
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const response = await fetch(`/api/bands/${jamId}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                showAlert("합주방 정보가 수정되었습니다.");
                setIsEditModalOpen(false);
                // Refresh data
                const res = await fetch(`/api/bands/${jamId}?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBandDetail(data);
                }
            } else {
                const error = await response.text();
                showAlert(`수정 실패: ${error}`);
            }
        } catch (error) {
            console.error("Update failed", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-gray-50 font-['Pretendard'] items-center justify-center">
                <div className="text-[#003C48] font-bold">로딩중...</div>
            </div>
        );
    }

    if (!bandDetail) {
        return (
            <div className="flex flex-col h-full bg-gray-50 font-['Pretendard'] items-center justify-center">
                <div className="text-[#003C48] font-bold">합주방 정보를 찾을 수 없습니다.</div>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 bg-[#00BDF8] text-white px-4 py-2 rounded-xl font-bold"
                >
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button onClick={() => navigate(-1)} className="text-[#052c42] shrink-0">
                        <FaChevronLeft size={24} />
                    </button>
                    {/* Profile Image */}
                    <div className="relative shrink-0">
                        <div
                            className={`w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center bg-gray-100 ${bandDetail.canManage ? 'cursor-pointer' : ''}`}
                            onClick={bandDetail.canManage ? handleEditClick : undefined}
                        >
                            {bandDetail.imgUrl ? (
                                <img src={bandDetail.imgUrl} alt={bandDetail.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <FaUnlink size={14} />
                                    <span className="text-[8px] mt-0.5">미연결</span>
                                </div>
                            )}
                        </div>
                        {bandDetail.canManage && (
                            <div className="absolute -bottom-1 -right-1 bg-gray-800 bg-opacity-50 text-white p-0.5 rounded-full pointer-events-none">
                                <FaRegEdit size={8} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2 overflow-hidden">
                        <SectionTitle as="h1" className="top-room-detail-title w-full truncate block whitespace-nowrap overflow-hidden text-ellipsis">
                            {bandDetail.title}
                        </SectionTitle>
                        <p className="top-room-detail-subtitle w-full truncate block whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                            {bandDetail.songTitle} : {bandDetail.artist}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <button
                        onClick={() => navigate(`/main/jam/chat/${jamId}`, {
                            state: {
                                roomNm: bandDetail.title,
                                roomType: 'BAND',
                                attachFilePath: bandDetail.imgUrl
                            }
                        })}
                        className="top-btn-chat"
                    >
                        단체 채팅
                    </button>
                    {bandDetail.canManage && (
                        <button
                            onClick={bandDetail.status === 'E' ? undefined : handleConfirmToggle}
                            className={`top-btn-status ${bandDetail.status === 'E' ? 'bg-gray-600 text-white cursor-default' : bandDetail.isConfirmed ? 'bg-[#00BDF8] text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            {bandDetail.status === 'E' ? "종료됨" : bandDetail.isConfirmed ? "확정" : "미확정"}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Session Status */}
                <section>
                    <SectionTitle className="mb-3">세션 현황</SectionTitle>
                    <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-3">
                        {(() => {
                            let occupiedCounter = 0;
                            return bandDetail.roles.map((role, idx) => {
                                const isOccupied = role.status === 'occupied';
                                const currentOccupiedIndex = isOccupied ? occupiedCounter++ : -1;
                                const bgUrl = isOccupied
                                    ? (currentOccupiedIndex % 2 === 0 ? role.onImgUrl1 : role.onImgUrl2)
                                    : role.offImgUrl;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex flex-col items-center justify-between bg-white rounded-xl relative overflow-hidden bg-cover bg-center transition-all duration-300 shadow-md border border-gray-100 group aspect-square ${bandDetail.status !== 'E' && !bandDetail.isConfirmed && (role.status === 'empty' || role.isCurrentUser)
                                            ? 'cursor-pointer active:scale-95'
                                            : ''
                                            }`}
                                        style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : {}}
                                        onClick={() => {
                                            if (bandDetail.status === 'E' || bandDetail.isConfirmed) return;
                                            if (role.status === 'empty') {
                                                handleJoin(role);
                                            } else if (role.isCurrentUser) {
                                                handleCancelSession(role);
                                            } else {
                                                // 타인 참여 중일 때 클릭하면 예약 로직 작동
                                                handleReserve(role);
                                            }
                                        }}
                                    >
                                        {/* Status Indicators (Top) */}
                                        <div className="absolute top-1.5 left-2 right-2 flex justify-between items-start z-20">
                                            {/* Crown Icon */}
                                            {isOccupied && role.isBandLeader ? (
                                                <div className="flex items-center justify-center text-yellow-400 drop-shadow-md">
                                                    <FaCrown size={16} />
                                                </div>
                                            ) : <div />}

                                            {/* Kick Button */}
                                            {isOccupied && bandDetail.canManage && !role.isCurrentUser && !bandDetail.isConfirmed && bandDetail.status !== 'E' && (
                                                <div
                                                    className="text-[#FF8A80] hover:text-red-500 cursor-pointer transition-colors drop-shadow-sm bg-white/20 rounded-full p-0.5 backdrop-blur-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleKick(role);
                                                    }}
                                                >
                                                    <FaMinusCircle size={16} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Center Icon */}
                                        <div className="relative z-10 flex flex-col items-center w-full h-full justify-center pb-8">
                                            <div className="scale-110 mb-1">
                                                {getFallbackIcon(role.part, bgUrl)}
                                            </div>
                                        </div>

                                        {/* Bottom Info Bar */}
                                        <div className="absolute bottom-1.5 left-0 right-2 z-20 flex flex-col items-end pointer-events-none">
                                            {/* 세션별 예약 텍스트 (세션명 바로 위에 오른쪽 배치) */}
                                            {(role.reservedCount || 0) > 0 && (
                                                <div
                                                    className="text-[#FFB74D] text-[10px] font-bold mb-0.5 pointer-events-auto cursor-pointer drop-shadow-sm hover:opacity-80 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fetchReservations(role.sessionTypeCd);
                                                    }}
                                                >
                                                    예약
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 justify-end w-full">
                                                <span className="font-bold text-[11px] text-[#052c42] truncate text-right drop-shadow-sm">
                                                    {role.part}
                                                </span>
                                            </div>
                                            {isOccupied ? (
                                                <span className="text-[9px] truncate max-w-[80px] font-bold text-gray-500 drop-shadow-sm">
                                                    {role.user}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-gray-500 drop-shadow-sm">
                                                    공석
                                                </span>
                                            )}
                                        </div>


                                    </div>
                                );
                            });
                        })()}
                        {/* Empty slots filler to match grid if needed, or just let CSS grid handle it */}
                    </div>
                </section>

                {/* Additional Features */}
                <section>
                    <SectionTitle className="mb-3">추가 기능</SectionTitle>
                    <div className="space-y-3">
                        {/* Schedule */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">합주 일정 조율</h3>
                            <button
                                onClick={() => {
                                    if (!bandDetail.isConfirmed) {
                                        showAlert("합주가 확정된 상태에서만 이용할 수 있습니다.");
                                        return;
                                    }
                                    const isMember = bandDetail.roles.some(r => r.isCurrentUser);
                                    if (!isMember) {
                                        showAlert("합주 참여자만 이용할 수 있습니다.");
                                        return;
                                    }
                                    navigate(`/main/jam/schedule/${jamId}`);
                                }}
                                className={`w-full font-bold py-2.5 rounded-xl shadow-sm text-[14px] transition-colors ${bandDetail.isConfirmed && bandDetail.roles.some(r => r.isCurrentUser)
                                    ? 'bg-[#00BDF8] text-white'
                                    : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                캘린더 보러가기
                            </button>
                        </div>

                        {/* Reservation */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">합주실 예약</h3>
                            <button className="w-full bg-[#00BDF8] text-white font-bold py-2.5 rounded-xl shadow-sm text-[14px]">
                                합주실 보러가기
                            </button>
                        </div>

                        {/* Concert */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">밴디콘 정기공연</h3>
                            <button className="w-full bg-[#00BDF8] text-white font-bold py-2.5 rounded-xl shadow-sm text-[14px]">
                                밴디콘서트 신청하기
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer - End/Delete Jam */}
            {bandDetail.canManage && (
                <div className="p-4 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    {bandDetail.status === 'E' ? (
                        <button
                            className="w-full bg-gray-500 text-white font-bold py-3 rounded-xl shadow-sm cursor-not-allowed text-[14px]"
                            disabled
                        >
                            합주 종료됨
                        </button>
                    ) : !bandDetail.isConfirmed ? (
                        <button
                            onClick={handleDelete}
                            className="w-full bg-[#FF8A80] text-white font-bold py-3 rounded-xl shadow-sm text-[14px]"
                        >
                            합주방 삭제
                        </button>
                    ) : (
                        <button
                            onClick={handleEndJam}
                            className="w-full bg-[#FF8A80] text-white font-bold py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity text-[14px]"
                        >
                            합주 종료
                        </button>
                    )}
                </div>
            )}

            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />

            {/* 개별 세션 예약자 목록 팝업 */}
            {rsvModal.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-lg">
                        <h2 className="text-base font-bold text-[#003C48] mb-3 text-center">
                            예약 현황 {rsvModal.reservations[0] && `(${rsvModal.reservations[0].sessionName})`}
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
                                        {(bandDetail?.canManage || rsv.userId === userId) ? (
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






            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg animate-fade-in-up">
                        <h2 className="text-xl font-bold text-[#003C48] mb-4 text-center">합주방 정보 수정</h2>

                        <div className="flex justify-center mb-6">
                            <div
                                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-[#00BDF8] overflow-hidden flex items-center justify-center cursor-pointer relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {editForm.previewUrl ? (
                                    <img src={editForm.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                        <FaUnlink size={28} />
                                        <span className="text-[11px] mt-1">미연결</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 bg-[#00BDF8] text-white p-1.5 rounded-full">
                                    <FaRegEdit size={12} />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                hidden
                                accept="image/*"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#003C48] mb-1">방 제목</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    placeholder="방 제목을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#003C48] mb-1">합주방 소개</label>
                                <textarea
                                    value={editForm.desc}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, desc: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8] h-24 resize-none"
                                    placeholder="합주방 소개를 입력하세요"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUpdateBand}
                                className="flex-1 bg-[#00BDF8] text-white font-bold py-3 rounded-xl hover:bg-[#00ACD8] transition-colors"
                            >
                                수정완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClanJamDetail;
