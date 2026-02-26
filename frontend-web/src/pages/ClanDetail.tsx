import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaRegEdit, FaCommentDots, FaUserFriends, FaMusic } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import GatheringCreateModal from '../components/GatheringCreateModal';
import GatheringApplyModal from '../components/GatheringApplyModal';

interface ClanDetailData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText: string;
    attachFilePath?: string; // Added field
    unreadChatCount?: number; // Added field
    cnUrl?: string; // Added field
}

const ClanDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clan, setClan] = useState<ClanDetailData | null>(null);
    const [notices, setNotices] = useState<any[]>([]);
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [recentJams, setRecentJams] = useState<any[]>([]); // Added state
    const [gatherings, setGatherings] = useState<any[]>([]); // New state for clan gatherings
    const [loading, setLoading] = useState(true);
    const [selectedPreviewDate, setSelectedPreviewDate] = useState<string | null>(null); // Moved here

    const [myRole, setMyRole] = useState<string>('NONE');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<{
        nm: string;
        desc: string;
        url: string;
        imageFile: File | null;
        previewUrl: string | null;
    }>({ nm: '', desc: '', url: '', imageFile: null, previewUrl: null });
    const [isGatheringCreateModalOpen, setIsGatheringCreateModalOpen] = useState(false);
    const [isGatheringApplyModalOpen, setIsGatheringApplyModalOpen] = useState(false);
    const [selectedGathering, setSelectedGathering] = useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertOpen(true);
    };

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
                const [clanRes, noticeRes, topRes, scheduleRes, jamRes, roleRes, gatheringsRes] = await Promise.all([
                    fetch(clanUrl),
                    fetch(`/api/clans/${id}/notices?limit=5`),
                    fetch(`/api/clans/${id}/boards/top`),
                    fetch(`/api/clan/schedule?clanId=${id}&year=${year}&month=${month}`),
                    fetch(userId ? `/api/clans/${id}/bands/recent?userId=${userId}` : `/api/clans/${id}/bands/recent`), // Fetch recent jams
                    userId ? fetch(`/api/clans/${id}/members/${userId}/role`) : Promise.resolve(null),
                    fetch(`/api/clans/gatherings/clan/${id}?userId=${userId || ''}`) // Fetch active gatherings
                ]);

                if (clanRes.ok) {
                    const data = await clanRes.json();
                    setClan({
                        id: data.cnNo,
                        name: data.cnNm,
                        description: data.cnDesc,
                        memberCount: data.userCnt,
                        logoColor: "bg-black",
                        logoText: data.cnNm ? data.cnNm.substring(0, 1) : "?",
                        attachFilePath: data.attachFilePath,
                        unreadChatCount: data.unreadChatCount,
                        cnUrl: data.cnUrl
                    });
                }

                if (roleRes && roleRes.ok) {
                    const role = await roleRes.text();
                    setMyRole(role);
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

                if (gatheringsRes && gatheringsRes.ok) {
                    const gatherData = await gatheringsRes.json();
                    // Sort: N (Recruiting) first, then by gatherNo DESC
                    const sortedGather = gatherData.sort((a: any, b: any) => {
                        if (a.gatherProcFg === 'N' && b.gatherProcFg !== 'N') return -1;
                        if (a.gatherProcFg !== 'N' && b.gatherProcFg === 'N') return 1;
                        return b.gatherNo - a.gatherNo;
                    });
                    setGatherings(sortedGather);
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

    const handleGatheringApplyClick = (gather: any) => {
        if (gather.applied) return;
        setSelectedGathering(gather);
        setIsGatheringApplyModalOpen(true);
    };

    const handleGatheringCancelClick = (gatherNo: number) => {
        setConfirmMessage('참여 신청을 취소하시겠습니까?');
        setOnConfirmAction(() => () => executeGatheringCancel(gatherNo));
        setIsConfirmOpen(true);
    };

    const executeGatheringCancel = async (gatherNo: number) => {
        setIsConfirmOpen(false);
        try {
            const userId = localStorage.getItem('userId');
            const response = await fetch(`/api/clans/gatherings/${gatherNo}/apply?userId=${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showAlert('참여 신청이 취소되었습니다.');
                // Refresh gatherings
                const gatheringsRes = await fetch(`/api/clans/gatherings/clan/${id}?userId=${userId || ''}`);
                if (gatheringsRes.ok) {
                    const gatherData = await gatheringsRes.json();
                    setGatherings(gatherData);
                }
            } else {
                const err = await response.json();
                showAlert(err.message || '취소 실패');
            }
        } catch (error) {
            console.error(error);
            showAlert('오류가 발생했습니다.');
        }
    };

    const handleEditClick = () => {
        if (myRole !== '01' && myRole !== '02') {
            // Optional: alert("권한이 없습니다.");
            return;
        }
        if (clan) {
            setEditForm({
                nm: clan.name || '',
                desc: clan.description || '',
                url: clan.cnUrl || '',
                imageFile: null,
                previewUrl: clan.attachFilePath || null
            });
            setIsEditModalOpen(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, imageFile: file, previewUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateClan = async () => {
        if (!id) return;
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // 필수값 검증
        if (!editForm.nm.trim()) {
            showAlert('클랜 이름을 입력해 주세요.');
            return;
        }
        if (!editForm.desc.trim()) {
            showAlert('클랜 소개를 입력해 주세요.');
            return;
        }

        try {
            const formData = new FormData();
            const updateData = {
                userId: userId,
                cnNm: editForm.nm,
                cnDesc: editForm.desc,
                cnUrl: editForm.url
            };
            formData.append('data', new Blob([JSON.stringify(updateData)], { type: 'application/json' }));
            if (editForm.imageFile) {
                formData.append('file', editForm.imageFile);
            }

            const response = await fetch(`/api/clans/${id}`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                setIsEditModalOpen(false);
                showAlert('클랜 정보가 수정되었습니다.');
                // alert 확인 후 리로드를 위해 onConfirm에서 처리
            } else {
                const err = await response.json();
                showAlert(err.message || '수정 실패');
            }
        } catch (e) {
            console.error(e);
            showAlert('오류가 발생했습니다.');
        }
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!clan) return <div className="text-center py-10">Clan not found</div>;

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">클랜</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-5">
                {/* Clan Info Card */}
                <div className="flex items-start gap-4 mb-6">
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 ${!clan.attachFilePath ? clan.logoColor : 'bg-white'} ${(myRole === '01' || myRole === '02') ? 'cursor-pointer hover:opacity-80' : ''} relative`}
                        onClick={handleEditClick}
                    >
                        {clan.attachFilePath ? (
                            <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-3xl font-bold">{clan.logoText}</span>
                        )}
                        {(myRole === '01' || myRole === '02') && (
                            <div className="absolute bottom-0 right-0 bg-gray-800 bg-opacity-50 text-white p-1 rounded-full">
                                <FaRegEdit size={10} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[#003C48] text-xl font-bold mb-1">{clan.name}</h2>
                        <p className="text-[#003C48] text-sm font-medium">멤버 : {clan.memberCount}명</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => navigate(`/main/chat/room/${id}`)} className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1 text-xs text-gray-600 shadow-sm whitespace-nowrap">
                            <FaCommentDots size={12} className="text-[#00BDF8]" /> 단체 채팅
                            {clan.unreadChatCount !== undefined && clan.unreadChatCount > 0 && (
                                <span className="bg-[#00BDF8] text-white text-[10px] rounded-full px-1.5 h-4 flex items-center justify-center -mr-1 min-w-[16px]">{clan.unreadChatCount}</span>
                            )}
                        </button>
                        <button onClick={() => navigate(`/main/clan/members/${id}`)} className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1 text-xs text-gray-600 shadow-sm whitespace-nowrap">
                            <FaUserFriends size={12} className="text-[#00BDF8]" /> 멤버 현황
                            <span className="bg-[#00BDF8] text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center -mr-1">{clan.memberCount}</span>
                        </button>
                        {myRole === '01' && (
                            <button onClick={() => setIsGatheringCreateModalOpen(true)} className="bg-white border border-[#FF8A80] rounded-full px-3 py-1 flex items-center gap-1 text-xs text-[#FF8A80] shadow-sm whitespace-nowrap hover:bg-[#FF8A80] hover:text-white transition-colors">
                                <FaMusic size={12} /> 합주 모집
                            </button>
                        )}
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

                {/* Gathering Notices - Only visible if there are active gatherings */}
                {gatherings.length > 0 && (
                    <div className="bg-white rounded-2xl border-2 border-[#FF8A80] shadow-md overflow-hidden animate-pulse-subtle">
                        <div className="bg-[#FF8A80] px-4 py-2 flex justify-between items-center">
                            <div
                                className={`flex items-center gap-2 text-white font-bold text-sm ${(myRole === '01' || myRole === '02') ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={() => {
                                    if (myRole === '01' || myRole === '02') {
                                        navigate(`/main/clan/gathering/management/${id}`);
                                    }
                                }}
                            >
                                <span>🎵 합주 모집 공고</span>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            {gatherings.map((gather) => (
                                <div key={gather.gatherNo} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center gap-4">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-[#003C48] font-bold text-[15px] truncate">{gather.title}</h4>
                                        <p className="text-gray-400 text-[11px] mt-1">합주일 : {gather.gatherDate && `${gather.gatherDate.substring(0, 4)}.${gather.gatherDate.substring(4, 6)}.${gather.gatherDate.substring(6, 8)}`}</p>
                                    </div>
                                    <div className="flex shrink-0">
                                        {gather.gatherProcFg === 'Y' ? (
                                            <button
                                                disabled
                                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-gray-200 text-gray-400 cursor-default whitespace-nowrap shadow-sm"
                                            >
                                                모집종료
                                            </button>
                                        ) : gather.gatherProcFg === 'M' ? (
                                            <button
                                                disabled
                                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-green-100 text-green-500 cursor-default whitespace-nowrap shadow-sm"
                                            >
                                                매핑완료
                                            </button>
                                        ) : gather.applied ? (
                                            <button
                                                onClick={() => handleGatheringCancelClick(gather.gatherNo)}
                                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-gray-500 text-white hover:bg-gray-600 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                            >
                                                참여취소
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleGatheringApplyClick(gather)}
                                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-[#FF8A80] text-white hover:bg-[#FF7060] transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                            >
                                                참여하기
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg animate-fade-in-up">
                        <h2 className="text-xl font-bold text-[#003C48] mb-4 text-center">클랜 정보 수정</h2>

                        <div className="flex justify-center mb-6">
                            <div
                                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-[#00BDF8] overflow-hidden flex items-center justify-center cursor-pointer relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {editForm.previewUrl ? (
                                    <img src={editForm.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[#00BDF8] text-3xl font-bold">{clan?.logoText}</span>
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
                                <label className="block text-sm font-bold text-[#003C48] mb-1">클랜 이름</label>
                                <input
                                    type="text"
                                    value={editForm.nm}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, nm: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    placeholder="클랜 이름을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#003C48] mb-1">클랜 소개</label>
                                <textarea
                                    value={editForm.desc}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, desc: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8] h-24 resize-none"
                                    placeholder="클랜 소개를 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#003C48] mb-1">URL (유튜브/참고자료)</label>
                                <input
                                    type="text"
                                    value={editForm.url}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    placeholder="URL을 입력하세요"
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
                                onClick={handleUpdateClan}
                                className="flex-1 bg-[#00BDF8] text-white font-bold py-3 rounded-xl hover:bg-[#00ACD8] transition-colors"
                            >
                                수정완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => {
                    setIsAlertOpen(false);
                    if (alertMessage === '클랜 정보가 수정되었습니다.') {
                        window.location.reload();
                    }
                }}
            />
            <CommonModal
                isOpen={isConfirmOpen}
                type="confirm"
                message={confirmMessage}
                onConfirm={() => {
                    if (onConfirmAction) onConfirmAction();
                    setIsConfirmOpen(false);
                }}
                onCancel={() => setIsConfirmOpen(false)}
            />

            {/* Gathering Modals */}
            {isGatheringCreateModalOpen && (
                <GatheringCreateModal
                    clanId={Number(id)}
                    userId={localStorage.getItem('userId') || ''}
                    onClose={() => setIsGatheringCreateModalOpen(false)}
                    onSubmit={() => {
                        window.location.reload(); // Refresh to show new notice
                    }}
                />
            )}
            {isGatheringApplyModalOpen && selectedGathering && (
                <GatheringApplyModal
                    gathering={selectedGathering}
                    userId={localStorage.getItem('userId') || ''}
                    onClose={() => setIsGatheringApplyModalOpen(false)}
                    onSubmit={() => {
                        window.location.reload(); // Refresh to show applied status
                    }}
                />
            )}
        </div>
    );
};

export default ClanDetail;
