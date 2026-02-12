import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaRegEdit, FaCommentDots, FaUserFriends } from 'react-icons/fa';

interface ClanDetailData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText: string;
    attachFilePath?: string; // Added field
    unreadChatCount?: number; // Added field
}

const ClanDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clan, setClan] = useState<ClanDetailData | null>(null);
    const [notices, setNotices] = useState<any[]>([]);
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [recentJams, setRecentJams] = useState<any[]>([]); // Added state
    const [loading, setLoading] = useState(true);
    const [selectedPreviewDate, setSelectedPreviewDate] = useState<string | null>(null); // Moved here

    useEffect(() => {
        const fetchMethod = async () => {
            if (!id) return;
            try {
                const userId = localStorage.getItem('userId');
                const clanUrl = userId ? `/api/clans/${id}?userId=${userId}` : `/api/clans/${id}`;
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;

                // Parallel fetch for clan details, notices, top posts, and schedules
                const [clanRes, noticeRes, topRes, scheduleRes, jamRes] = await Promise.all([
                    fetch(clanUrl),
                    fetch(`/api/clans/${id}/notices?limit=5`),
                    fetch(`/api/clans/${id}/boards/top`),
                    fetch(`/api/clan/schedule?clanId=${id}&year=${year}&month=${month}`),
                    fetch(userId ? `/api/clans/${id}/bands/recent?userId=${userId}` : `/api/clans/${id}/bands/recent`) // Fetch recent jams
                ]);

                if (clanRes.ok) {
                    const data = await clanRes.json();
                    console.log("Clan Detail Response:", data);
                    setClan({
                        id: data.cnNo,
                        name: data.cnNm,
                        description: data.cnDesc,
                        memberCount: data.userCnt,
                        logoColor: "bg-black",
                        logoText: data.cnNm ? data.cnNm.substring(0, 1) : "?",
                        attachFilePath: data.attachFilePath,
                        unreadChatCount: data.unreadChatCount
                    });
                }

                if (noticeRes.ok) {
                    const noticeData = await noticeRes.json();
                    setNotices(noticeData);
                }

                if (topRes.ok) {
                    const topData = await topRes.json();
                    setTopPosts(topData);
                }

                if (scheduleRes.ok) {
                    const scheduleData = await scheduleRes.json();
                    setSchedules(scheduleData);
                }

                if (jamRes.ok) {
                    const jamData = await jamRes.json();
                    setRecentJams(jamData);
                }

            } catch (error) {
                console.error("Failed to fetch clan data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMethod();
    }, [id]);

    // Derived State Logic (Safe to be here or after early returns, but functions using state setters must be consistent)
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todaySchedules = schedules.filter((s: any) => s.sttDate === todayStr);
    const todayScheduleTitle = todaySchedules.length > 0 ? todaySchedules[0].title : "오늘 일정 없음";

    const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);

    const weekDaysData = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const hasSchedule = schedules.some((s: any) => s.sttDate === dateStr);
        const isToday = d.toDateString() === today.toDateString();
        const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i];
        weekDaysData.push({ hasSchedule, isToday, label: dayLabel, dateStr });
    }

    const togglePreviewDate = (dateStr: string) => {
        if (selectedPreviewDate === dateStr) {
            setSelectedPreviewDate(null);
        } else {
            setSelectedPreviewDate(dateStr);
        }
    };

    const selectedSchedules = selectedPreviewDate ? schedules.filter((s: any) => s.sttDate === selectedPreviewDate) : [];

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!clan) return <div className="text-center py-10">Clan not found</div>;

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2 justify-between">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">클랜</h1>
                </div>
                <button className="text-gray-500">
                    <FaRegEdit size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-6">
                {/* Clan Info Card */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 ${!clan.attachFilePath ? clan.logoColor : 'bg-white'}`}>
                        {clan.attachFilePath ? (
                            <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-3xl font-bold">{clan.logoText}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-[#003C48] text-xl font-bold mb-1">{clan.name}</h2>
                        <p className="text-[#003C48] text-sm mb-1">{clan.description}</p>
                        <p className="text-[#003C48] text-sm font-medium">멤버 : {clan.memberCount}명</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => navigate(`/main/chat/room/${id}`)} className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1 text-xs text-gray-600 shadow-sm">
                            <FaCommentDots size={12} className="text-[#00BDF8]" /> 단체 채팅
                            {clan.unreadChatCount !== undefined && clan.unreadChatCount > 0 && (
                                <span className="bg-[#00BDF8] text-white text-[10px] rounded-full px-1.5 h-4 flex items-center justify-center -mr-1 min-w-[16px]">{clan.unreadChatCount}</span>
                            )}
                        </button>
                        <button onClick={() => navigate(`/main/clan/members/${id}`)} className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1 text-xs text-gray-600 shadow-sm">
                            <FaUserFriends size={12} className="text-[#00BDF8]" /> 멤버 현황
                            <span className="bg-[#00BDF8] text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center -mr-1">{clan.memberCount}</span>
                        </button>
                    </div>
                </div>

                {/* Notices */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-[#4FC3F7] px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <span>🔔 공지</span>
                        </div>
                        <span onClick={() => navigate(`/main/clan/notice/${id}`)} className="text-white text-xs cursor-pointer hover:underline">더보기</span>
                    </div>
                    <div className="p-4 space-y-2">
                        {notices.length > 0 ? (
                            notices.map((notice, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between items-center text-[#003C48] text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                    onClick={() => navigate(`/main/clan/notice/${id}/detail/${notice.cnNoticeNo}`)}
                                >
                                    <span className={`truncate mr-2 ${notice.pinYn === 'Y' ? 'font-bold' : ''}`}>
                                        • {notice.title} {notice.commentCount > 0 && <span className="text-[#00BDF8] text-xs">[{notice.commentCount}]</span>}
                                    </span>
                                    {/* Removed minus circle for preview */}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-xs">등록된 공지가 없습니다.</div>
                        )}
                    </div>
                </div>

                {/* Clan Jam Rooms */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[#003C48] font-bold text-lg">클랜 합주방</h3>
                        <span onClick={() => navigate(`/main/clan/jam/${id}`)} className="text-gray-400 text-xs cursor-pointer">더보기</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {recentJams.length > 0 ? (
                            recentJams.map((jam) => (
                                <div key={jam.id} className="min-w-[160px] border border-[#00BDF8] rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                                    if (jam.member || jam.isMember) {
                                        navigate(`/main/clan/jam/room/${jam.id}`);
                                    } else {
                                        navigate(`/main/clan/jam/${id}`);
                                    }
                                }}>
                                    <h4 className="text-[#003C48] font-bold text-sm truncate">{jam.title}</h4>
                                    <p className="text-gray-500 text-xs mb-2">: {jam.artist}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {jam.roles.map((role: any, idx: number) => (
                                            <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] ${role.status === 'occupied' ? 'bg-[#FF8A80] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                {role.part}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-xs w-full text-center py-4">
                                진행 중인 합주가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[#003C48] font-bold text-lg">클랜 캘린더</h3>
                        <span onClick={() => navigate(`/main/clan/calendar/${id}`)} className="text-gray-400 text-xs cursor-pointer hover:text-[#00BDF8]">캘린더 보기</span>
                    </div>
                    {/* Today's Schedule Display */}
                    <div className="mb-2 text-[#003C48] font-bold flex items-center gap-2">
                        <span>
                            {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })} ({['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date().getDay()]})
                        </span>
                        <span className="font-normal text-sm text-gray-500 truncate flex-1 block">
                            {todayScheduleTitle}
                        </span>
                    </div>

                    {/* Weekly View */}
                    <div className="bg-gray-100 rounded-full px-4 py-2 flex justify-between items-center text-gray-500 font-medium select-none">
                        {weekDaysData.map((day, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center gap-1 cursor-pointer"
                                onClick={() => togglePreviewDate(day.dateStr)}
                            >
                                {day.hasSchedule ? (
                                    <div className="w-1.5 h-1.5 bg-[#FF8A80] rounded-full"></div>
                                ) : (
                                    <div className="w-1.5 h-1.5 opacity-0"></div>
                                )}
                                <span className={`${day.isToday ? "text-[#00BDF8] font-bold" : ""} ${selectedPreviewDate === day.dateStr ? "bg-[#00BDF8] text-white rounded-full w-6 h-6 flex items-center justify-center -my-1" : ""}`}>
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Selected Schedules List */}
                    {selectedPreviewDate && (
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 animate-fade-in-down">
                            {selectedSchedules.length > 0 ? (
                                selectedSchedules.map((sch: any) => (
                                    <div key={sch.cnSchNo} className="flex items-center gap-2 text-sm text-[#003C48]">
                                        <div className="w-1.5 h-1.5 bg-[#003C48] rounded-full"></div>
                                        <span>{sch.title}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-xs text-gray-400 py-2">
                                    해당 날짜에 일정이 없습니다.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Board */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[#003C48] font-bold text-lg">클랜 게시판</h3>
                        <span onClick={() => navigate(`/main/clan/board/${id}`)} className="text-gray-400 text-xs cursor-pointer">더보기</span>
                    </div>
                    {topPosts.length > 0 ? (
                        topPosts.map((post) => (
                            <div key={post.cnBoardNo} className="mb-3 last:mb-0 border-b border-gray-50 last:border-0 pb-2 last:pb-0" onClick={() => navigate(`/main/clan/board/${id}/${post.cnBoardTypeNo}/post/${post.cnBoardNo}`)}>
                                <div className="mb-1 text-[#003C48] font-medium text-sm truncate">{post.title}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{post.userNickNm}</span>
                                    <span className="flex items-center gap-0.5"><span className="text-[10px]">👍</span> ({post.boardLikeCnt})</span>
                                    <span className="ml-auto">
                                        {post.regDate && post.regDate.length >= 8 ?
                                            `${post.regDate.substring(0, 4)}.${post.regDate.substring(4, 6)}.${post.regDate.substring(6, 8)}` : post.regDate}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 text-sm py-4 text-center">등록된 인기 게시글이 없습니다.</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ClanDetail;
