import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMicrophone, FaGuitar, FaDrum, FaCrown } from 'react-icons/fa';
import { GiGrandPiano } from "react-icons/gi";
import CommonModal from '../components/common/CommonModal';

interface JamRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part: string;
    user?: string;
    status: 'empty' | 'occupied' | 'reserved';
    isCurrentUser?: boolean;
    isBandLeader?: boolean;
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

    const getIcon = (part: string) => {
        if (part.includes('보컬')) return <FaMicrophone size={32} className="text-[#00BDF8]" />;
        if (part.includes('기타')) return <FaGuitar size={32} className="text-[#00BDF8]" />;
        if (part.includes('베이스')) return <FaGuitar size={32} className="text-[#00BDF8]" />; // Fallback to FaGuitar for now
        if (part.includes('드럼')) return <FaDrum size={32} className="text-[#00BDF8]" />;
        if (part.includes('키보드') || part.includes('건반')) return <GiGrandPiano size={32} className="text-[#00BDF8]" />;
        return <div className="w-8 h-8 bg-gray-200 rounded-full" />;
    };

    if (isLoading) return <div className="p-4">Loading...</div>;

    if (!bandDetail) {
        return (
            <div className="flex flex-col h-full bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
                <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="text-gray-600 mr-2">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg text-[#003C48] font-bold leading-tight">합주 상세</h1>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-gray-500">합주 정보를 불러올 수 없습니다.</p>
                </div>
                <CommonModal
                    isOpen={modalConfig.isOpen}
                    type={modalConfig.type}
                    message={modalConfig.message}
                    onConfirm={modalConfig.onConfirm}
                    onCancel={closeModal}
                />
            </div>
        );
    }

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

    const handleEndJam = () => {
        showConfirm("합주를 종료하시겠습니까?", async () => {
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

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="text-gray-600">
                        <FaChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg text-[#003C48] font-bold leading-tight">{bandDetail.title}</h1>
                        <p className="text-xs text-gray-500">{bandDetail.songTitle} : {bandDetail.artist}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {bandDetail.canManage && (
                        <button
                            onClick={bandDetail.status === 'E' ? undefined : handleConfirmToggle}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${bandDetail.status === 'E' ? 'bg-gray-600 text-white cursor-default' : bandDetail.isConfirmed ? 'bg-[#00BDF8] text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            {bandDetail.status === 'E' ? "종료됨" : bandDetail.isConfirmed ? "확정" : "미확정"}
                        </button>
                    )}
                    <button className="bg-[#00BDF8] text-white text-xs px-3 py-1.5 rounded-full font-bold">
                        단체 채팅
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Session Status */}
                <section>
                    <h2 className="text-[#003C48] font-bold text-lg mb-3">세션 현황</h2>
                    <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-3">
                        {bandDetail.roles.map((role, idx) => {

                            const isOccupied = role.status === 'occupied';

                            return (
                                <div key={idx} className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-3 relative h-32">
                                    {isOccupied && role.isBandLeader && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center text-yellow-400">
                                            <FaCrown size={20} />
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        {getIcon(role.part)}
                                    </div>
                                    <span className="text-[#003C48] font-bold text-sm mb-1">{role.part}</span>
                                    {isOccupied ? (
                                        <div className="flex items-center gap-1">
                                            {/* Avatar placeholder - replace with actual if available */}
                                            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                                            <span className="text-gray-600 text-xs truncate max-w-[50px]">{role.user}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs">공석</span>
                                    )}
                                </div>
                            );
                        })}
                        {/* Empty slots filler to match grid if needed, or just let CSS grid handle it */}
                    </div>
                </section>

                {/* Additional Features */}
                <section>
                    <h2 className="text-[#003C48] font-bold text-lg mb-3">추가 기능</h2>
                    <div className="space-y-3">
                        {/* Schedule */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">합주 일정 조율</h3>
                            <button className="w-full bg-[#00BDF8] text-white font-bold py-2.5 rounded-xl shadow-sm text-sm">
                                캘린더 보러가기
                            </button>
                        </div>

                        {/* Reservation */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">합주실 예약</h3>
                            <button className="w-full bg-[#00BDF8] text-white font-bold py-2.5 rounded-xl shadow-sm text-sm">
                                합주실 보러가기
                            </button>
                        </div>

                        {/* Concert */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <h3 className="text-[#003C48] font-bold text-sm mb-3">밴디콘 정기공연</h3>
                            <button className="w-full bg-[#00BDF8] text-white font-bold py-2.5 rounded-xl shadow-sm text-sm">
                                밴디콘서트 신청하기
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer - End/Delete Jam */}
            {bandDetail.canManage && (
                <div className="p-4 bg-white sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    {bandDetail.status === 'E' ? (
                        <button
                            className="w-full bg-gray-500 text-white font-bold py-3 rounded-xl shadow-sm cursor-not-allowed"
                            disabled
                        >
                            합주 종료됨
                        </button>
                    ) : !bandDetail.isConfirmed ? (
                        <button
                            onClick={handleDelete}
                            className="w-full bg-[#FF8A80] text-white font-bold py-3 rounded-xl shadow-sm"
                        >
                            합주방 삭제
                        </button>
                    ) : (
                        <button
                            onClick={handleEndJam}
                            className="w-full bg-[#FF8A80] text-white font-bold py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
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
        </div>
    );
};

export default ClanJamDetail;
