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
}

interface MatchRoom {
    roomNo: number;
    gatherNo: number;
    roomNm: string;
    skillScoreTot: number;
    memberCnt: number;
    skillScoreAvg: number;
    requiredSessionNmList: string[]; // Added this to interface
    members: Member[];
}

const GatheringMatchResult: React.FC = () => {
    const { gatherNo } = useParams<{ gatherNo: string }>();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<MatchRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        if (gatherNo) {
            fetchResults();
        }
    }, [gatherNo]);

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
                        {rooms.map((room) => {
                            // Group members by session for display
                            const membersBySession = room.members.reduce((acc, member) => {
                                if (!acc[member.sessionTypeNm]) {
                                    acc[member.sessionTypeNm] = [];
                                }
                                acc[member.sessionTypeNm].push(member);
                                return acc;
                            }, {} as Record<string, Member[]>);

                            // Count required sessions to build the skeleton slots
                            const requiredCounts = room.requiredSessionNmList?.reduce((acc, sessionNm) => {
                                acc[sessionNm] = (acc[sessionNm] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>) || {};

                            // If there are required sessions, we iterate based on them. Otherwise fallback to just members' sessions.
                            const displaySessions = Object.keys(requiredCounts).length > 0
                                ? Object.keys(requiredCounts)
                                : Object.keys(membersBySession);

                            return (
                                <div key={room.roomNo} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#003C48]"></div>

                                    <div className="flex justify-between items-center mb-5 border-b pb-3">
                                        <h3 className="text-xl font-bold text-[#003C48] flex items-center gap-2">
                                            {room.roomNm}
                                        </h3>
                                        <div className="flex items-center text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                                            <FaUserAlt className="mr-1.5" size={10} /> {room.memberCnt}명 배정
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-3">
                                        {displaySessions.map((sessionName) => {
                                            const membersInSession = membersBySession[sessionName] || [];
                                            const requiredSlotCount = requiredCounts[sessionName] || membersInSession.length;

                                            // Fill real members, then pad with "미참여" (공석) until requiredSlotCount is met
                                            const displaySlots = [...membersInSession];
                                            while (displaySlots.length < requiredSlotCount) {
                                                displaySlots.push(null as any); // null represents "공석"
                                            }

                                            return displaySlots.map((member, index) => {
                                                const isOccupied = member != null;

                                                return (
                                                    <div key={`${sessionName}-${index}`} className="flex flex-col items-center justify-between bg-gray-50 rounded-xl p-3 relative min-h-[160px]">
                                                        <div className="mb-2">
                                                            {getIcon(sessionName)}
                                                        </div>
                                                        <span className="text-[#003C48] font-bold text-sm mb-1">{sessionName}</span>

                                                        {isOccupied ? (
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                                                                <span className="text-gray-600 text-xs truncate max-w-[50px]">{member.userNickNm}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">공석</span>
                                                        )}

                                                        <div className="w-full mt-2">
                                                            {isOccupied ? (
                                                                <button
                                                                    disabled
                                                                    className="w-full bg-[#00BDF8] text-white text-xs font-bold py-1.5 rounded-lg shadow-sm opacity-50 cursor-default"
                                                                >
                                                                    참여중
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    className="w-full bg-[#EFF1F3] text-[#003C48] text-xs font-bold py-1.5 rounded-lg shadow-sm cursor-default"
                                                                >
                                                                    참여
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GatheringMatchResult;
