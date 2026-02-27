import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMusic, FaUserAlt, FaMicrophone, FaGuitar, FaDrum } from 'react-icons/fa';
import { GiGrandPiano } from "react-icons/gi";

interface Member {
    resultNo: number;
    userId: string;
    userNickNm: string;
    sessionTypeCd: string;
    sessionTypeNm: string;
    skillScore: number;
    userGenderCd: string;
}

interface MatchRoom {
    roomNo: number;
    gatherNo: number;
    roomNm: string;
    skillScoreTot: number;
    memberCnt: number;
    skillScoreAvg: number;
    requiredSessionNmList: string[];
    requiredSessionCdList: string[];
    members: Member[];
}

interface SwapConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    from: { sessionNm: string; userNickNm: string };
    to: { sessionNm: string; userNickNm: string };
}

const SwapConfirmModal: React.FC<SwapConfirmModalProps> = ({ isOpen, onClose, onConfirm, from, to }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-[#00BDF8]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00BDF8]">
                        <FaMusic size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-[#003C48] mb-2">자리 교체 확인</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        아래 두 자리의 멤버를<br />정말로 교체하시겠습니까?
                    </p>

                    <div className="flex flex-col gap-3 mb-8">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{from.sessionNm}</span>
                            <span className="text-[13px] font-bold text-[#003C48]">{from.userNickNm || '미참여'}</span>
                        </div>
                        <div className="flex justify-center -my-2 z-10">
                            <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100 text-[#00BDF8]">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{to.sessionNm}</span>
                            <span className="text-[13px] font-bold text-[#003C48]">{to.userNickNm || '미참여'}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3.5 px-4 rounded-2xl bg-[#00BDF8] text-white font-bold shadow-lg shadow-[#00BDF8]/20 hover:bg-[#00BDF8]/90 active:scale-95 transition-all"
                        >
                            교체하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GatheringMatchResult: React.FC = () => {
    const { gatherNo } = useParams<{ gatherNo: string }>();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<MatchRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [selection, setSelection] = useState<{
        roomNo: number;
        userId: string | null;
        sessionCd: string;
        sessionNm: string;
        userNickNm: string;
    } | null>(null);
    const [swapTarget, setSwapTarget] = useState<{
        roomNo: number;
        userId: string | null;
        sessionCd: string;
        sessionNm: string;
        userNickNm: string;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchResults = async () => {
        try {
            const response = await fetch(`/api/clans/gatherings/${gatherNo}/match-results`);
            if (response.ok) {
                const data = await response.json();
                setRooms(data);
            } else {
                console.error("Failed to fetch match results");
            }
        } catch (error) {
            console.error("Error fetching match results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (gatherNo) {
            fetchResults();
        }
    }, [gatherNo]);

    const handleSlotClick = (roomNo: number, userId: string | null, sessionCd: string, sessionNm: string, userNickNm: string) => {
        if (!selection) {
            setSelection({ roomNo, userId, sessionCd, sessionNm, userNickNm });
            return;
        }

        if (selection.roomNo === roomNo && selection.userId === userId && selection.sessionCd === sessionCd) {
            setSelection(null);
            return;
        }

        setSwapTarget({ roomNo, userId, sessionCd, sessionNm, userNickNm });
        setIsModalOpen(true);
    };

    const confirmSwap = async () => {
        if (!selection || !swapTarget) return;

        try {
            const response = await fetch(`/api/clans/gatherings/${gatherNo}/swap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromRoomNo: selection.roomNo,
                    fromUserId: selection.userId,
                    fromSessionCd: selection.sessionCd,
                    toRoomNo: swapTarget.roomNo,
                    toUserId: swapTarget.userId,
                    toSessionCd: swapTarget.sessionCd,
                    userId: "snyun"
                })
            });

            if (response.ok) {
                setSelection(null);
                setSwapTarget(null);
                setIsModalOpen(false);
                fetchResults();
            } else {
                alert("교체에 실패했습니다.");
            }
        } catch (error) {
            console.error("Swap error", error);
            alert("오류가 발생했습니다.");
        }
    };

    const getIcon = (part: string) => {
        if (!part) return <div className="w-8 h-8 bg-gray-200 rounded-full" />;
        if (part.includes('보컬')) return <FaMicrophone size={32} className="text-[#00BDF8]" />;
        if (part.includes('기타')) return <FaGuitar size={32} className="text-[#00BDF8]" />;
        if (part.includes('베이스')) return <FaGuitar size={32} className="text-[#00BDF8]" />;
        if (part.includes('드럼')) return <FaDrum size={32} className="text-[#00BDF8]" />;
        if (part.includes('키보드') || part.includes('건반')) return <GiGrandPiano size={32} className="text-[#00BDF8]" />;
        return <div className="w-8 h-8 bg-gray-200 rounded-full" />;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
            {/* Top Navigation Bar */}
            <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 transition-shadow duration-200">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-[#003C48] transition-colors p-2">
                    <FaChevronLeft size={20} />
                </button>
                <h2 className="flex-1 text-center font-bold text-xl text-[#003C48]">합주 매핑 결과</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 p-5 pb-20 mt-4 max-w-lg mx-auto w-full">


                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003C48]"></div>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <FaMusic className="mx-auto text-4xl text-gray-300 mb-4" />
                        <p className="text-gray-500">배정된 합주 팀이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rooms
                            .sort((a, b) => {
                                // 1. Priority: All required sessions filled
                                const aRequiredCount = a.requiredSessionCdList?.length || 0;
                                const bRequiredCount = b.requiredSessionCdList?.length || 0;
                                const aFilled = a.memberCnt >= aRequiredCount;
                                const bFilled = b.memberCnt >= bRequiredCount;

                                if (aFilled !== bFilled) {
                                    return aFilled ? -1 : 1;
                                }

                                // 2. Room No
                                return a.roomNo - b.roomNo;
                            })
                            .map((room) => {
                                // Group members by session for display
                                const membersBySession = room.members.reduce((acc, member) => {
                                    if (!acc[member.sessionTypeNm]) {
                                        acc[member.sessionTypeNm] = [];
                                    }
                                    acc[member.sessionTypeNm].push(member);
                                    return acc;
                                }, {} as Record<string, Member[]>);

                                // Pair required names and codes
                                const requiredPairs = room.requiredSessionNmList?.map((nm, idx) => ({
                                    nm,
                                    cd: room.requiredSessionCdList[idx]
                                })) || [];

                                // Group pairs by name
                                const pairsByNm = requiredPairs.reduce((acc, pair) => {
                                    if (!acc[pair.nm]) acc[pair.nm] = [];
                                    acc[pair.nm].push(pair.cd);
                                    return acc;
                                }, {} as Record<string, string[]>);

                                return (
                                    <div key={room.roomNo} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#003C48]"></div>

                                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                                            <h3 className="text-lg font-bold text-[#003C48] flex items-center gap-2">
                                                {room.roomNm}
                                            </h3>
                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                <div className="flex items-center text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100">
                                                    <span className="opacity-70 mr-1">평균</span> {room.skillScoreAvg.toFixed(1)}
                                                </div>
                                                <div className="flex items-center text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100">
                                                    <span className="opacity-70 mr-1">총점</span> {room.skillScoreTot}
                                                </div>
                                                <div className="flex items-center text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
                                                    <FaUserAlt className="mr-1" size={9} /> {room.memberCnt}명
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl py-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                                {Object.keys(pairsByNm).map((sessionName) => {
                                                    const sessionCds = pairsByNm[sessionName];
                                                    const membersInSession = membersBySession[sessionName] || [];

                                                    const displaySlots = sessionCds.map((cd, idx) => {
                                                        const member = membersInSession[idx] || null;
                                                        return { cd, member };
                                                    });

                                                    return displaySlots.map(({ cd, member }, index) => {
                                                        const isOccupied = member != null;
                                                        const isSelected = selection?.roomNo === room.roomNo &&
                                                            selection?.userId === (member?.userId || null) &&
                                                            selection?.sessionCd === cd;

                                                        // Function to get distinct colors per session
                                                        const getSessionColor = (name: string) => {
                                                            if (name.includes('보컬')) return 'bg-rose-50 text-rose-500 border-rose-100';
                                                            if (name.includes('기타')) return 'bg-orange-50 text-orange-500 border-orange-100';
                                                            if (name.includes('베이스')) return 'bg-amber-50 text-amber-600 border-amber-100';
                                                            if (name.includes('키보드') || name.includes('건반')) return 'bg-emerald-50 text-emerald-500 border-emerald-100';
                                                            if (name.includes('드럼')) return 'bg-purple-50 text-purple-500 border-purple-100';
                                                            return 'bg-blue-50 text-blue-500 border-blue-100'; // Default
                                                        };

                                                        return (
                                                            <div
                                                                key={`${sessionName}-${index}`}
                                                                onClick={() => handleSlotClick(room.roomNo, member?.userId || null, cd, sessionName, member?.userNickNm || '')}
                                                                className={`flex items-center justify-between rounded-xl p-3 border cursor-pointer transition-all duration-300 min-w-0 ${isSelected
                                                                    ? 'border-[#00BDF8] bg-blue-50/50 ring-2 ring-[#00BDF8] ring-offset-1 scale-[1.03] shadow-lg shadow-[#00BDF8]/20 z-10'
                                                                    : 'bg-white border-gray-100 hover:border-[#00BDF8]/40 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {/* Name/Status (Left side - Expanded) */}
                                                                <div className="flex-1 min-w-0 pr-1">
                                                                    {isOccupied ? (
                                                                        <div className="text-[14px] font-extrabold text-[#003C48] truncate" title={member.userNickNm}>
                                                                            {member.userNickNm}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[13px] font-bold text-gray-300 italic">미참여</span>
                                                                    )}
                                                                </div>

                                                                {/* Session Role & Level (Right side - Aligned right) */}
                                                                <div className="flex flex-col items-end shrink-0 gap-1 ml-auto">
                                                                    <span className={`text-[8px] whitespace-nowrap font-black px-1.5 py-0.5 rounded border ${getSessionColor(sessionName)} ${!isOccupied ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                                                                        {sessionName}
                                                                    </span>
                                                                    {isOccupied && (
                                                                        <span className={`text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full border shadow-sm ${member.userGenderCd === 'M'
                                                                            ? 'text-blue-600 bg-blue-50 border-blue-100'
                                                                            : 'text-rose-500 bg-rose-50 border-rose-100'
                                                                            }`}>
                                                                            Lv.{member.skillScore}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Swap Confirmation Modal */}
            <SwapConfirmModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelection(null);
                }}
                onConfirm={confirmSwap}
                from={selection || { sessionNm: '', userNickNm: '' }}
                to={swapTarget || { sessionNm: '', userNickNm: '' }}
            />
        </div>
    );
};

export default GatheringMatchResult;
