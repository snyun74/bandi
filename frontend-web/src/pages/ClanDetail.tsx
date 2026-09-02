import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaRegEdit,
    FaRegClock,
    FaUserFriends,
    FaBell,
    FaHeart,
    FaRegCommentDots
} from 'react-icons/fa';
import { MessageSquare, User, Music } from 'lucide-react';
import CommonModal from '../components/common/CommonModal';
import GatheringCreateModal from '../components/GatheringCreateModal';
import GatheringApplyModal from '../components/GatheringApplyModal';
import DefaultProfile from '../components/common/DefaultProfile';

interface ClanDetailData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText: string;
    attachFilePath?: string;
    unreadChatCount?: number;
    cnUrl?: string;
}

const ClanDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clan, setClan] = useState<ClanDetailData | null>(null);
    const [notices, setNotices] = useState<any[]>([]);
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [recentJams, setRecentJams] = useState<any[]>([]);
    const [gatherings, setGatherings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Calendar week navigation state
    const [weekStart, setWeekStart] = useState<Date>(() => {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    });
    const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    });

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

                // Range for schedules (current week +- 2 weeks)
                const rangeStart = new Date(weekStart);
                rangeStart.setDate(rangeStart.getDate() - 14);
                const rangeEnd = new Date(weekStart);
                rangeEnd.setDate(rangeEnd.getDate() + 21);

                const formatDateStr = (d: Date) =>
                    d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

                const startDateStr = formatDateStr(rangeStart);
                const endDateStr = formatDateStr(rangeEnd);

                const [clanRes, noticeRes, topRes, scheduleRes, jamRes, roleRes, gatheringsRes] = await Promise.all([
                    fetch(clanUrl),
                    fetch(`/api/clans/${id}/notices?limit=5`),
                    fetch(`/api/clans/${id}/boards/top?userId=${userId || ''}`),
                    fetch(`/api/clan/schedule?clanId=${id}&startDate=${startDateStr}&endDate=${endDateStr}`),
                    fetch(userId ? `/api/clans/${id}/bands/recent?userId=${userId}` : `/api/clans/${id}/bands/recent`),
                    userId ? fetch(`/api/clans/${id}/members/${userId}/role`) : Promise.resolve(null),
                    fetch(`/api/clans/gatherings/clan/${id}?userId=${userId || ''}`)
                ]);

                if (clanRes.ok) {
                    const data = await clanRes.json();
                    setClan({
                        id: data.cnNo,
                        name: data.cnNm,
                        description: data.cnDesc,
                        memberCount: data.userCnt,
                        logoColor: 'bg-black',
                        logoText: data.cnNm ? data.cnNm.substring(0, 1) : '?',
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
                    setNotices(Array.isArray(noticeData) ? noticeData : []);
                }

                if (topRes.ok) {
                    const topData = await topRes.json();
                    setTopPosts(Array.isArray(topData) ? topData : []);
                }

                if (scheduleRes.ok) {
                    const scheduleData = await scheduleRes.json();
                    setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
                }

                if (jamRes.ok) {
                    const jamData = await jamRes.json();
                    setRecentJams(Array.isArray(jamData) ? jamData : []);
                }

                if (gatheringsRes && gatheringsRes.ok) {
                    const gatherData = await gatheringsRes.json();
                    const sortedGather = (Array.isArray(gatherData) ? gatherData : []).sort((a: any, b: any) => {
                        if (a.gatherProcFg === 'N' && b.gatherProcFg !== 'N') return -1;
                        if (a.gatherProcFg !== 'N' && b.gatherProcFg === 'N') return 1;
                        return b.gatherNo - a.gatherNo;
                    });
                    setGatherings(sortedGather);
                }
            } catch (error) {
                console.error('Failed to fetch clan data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMethod();
    }, [id, weekStart]);

    // Calendar week calculations
    const weekDays = useMemo(() => {
        const days = [];
        const todayStr = (() => {
            const t = new Date();
            return `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`;
        })();

        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            const dayNum = d.getDate();
            const hasSchedule = schedules.some((s: any) => s.sttDate === dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const label = ['일', '월', '화', '수', '목', '금', '토'][i];

            days.push({
                date: d,
                dateStr,
                dayNum,
                label,
                hasSchedule,
                isToday,
                isSelected
            });
        }
        return days;
    }, [weekStart, schedules, selectedDateStr]);

    // Week header title (e.g. "8월 4주")
    const weekTitle = useMemo(() => {
        // Find Thursday of this week to determine the month
        const thursday = new Date(weekStart);
        thursday.setDate(weekStart.getDate() + 4);
        const month = thursday.getMonth() + 1;

        // Week number of the month
        const firstDayOfMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1);
        const pastDays = (thursday.getDate() - 1) + firstDayOfMonth.getDay();
        const weekNum = Math.ceil((pastDays + 1) / 7);

        return `${month}월 ${weekNum}주`;
    }, [weekStart]);

    const handlePrevWeek = () => {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() - 7);
        setWeekStart(next);
    };

    const handleNextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(weekStart.getDate() + 7);
        setWeekStart(next);
    };

    const selectedSchedules = useMemo(() => {
        return schedules.filter((s: any) => s.sttDate === selectedDateStr);
    }, [schedules, selectedDateStr]);

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
            } else {
                const err = await response.json();
                showAlert(err.message || '수정 실패');
            }
        } catch (e) {
            console.error(e);
            showAlert('오류가 발생했습니다.');
        }
    };

    const formatPostDate = (dateStr?: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        // 20260312... -> 26.03.12
        const y = dateStr.substring(2, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

    const formatScheduleDate = (sttDate?: string) => {
        if (!sttDate || sttDate.length < 8) return '일정 미정';
        const m = parseInt(sttDate.substring(4, 6), 10);
        const d = parseInt(sttDate.substring(6, 8), 10);
        const dateObj = new Date(parseInt(sttDate.substring(0, 4), 10), m - 1, d);
        const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

        return `${m}/${d}(${dayLabel})`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FAFBFD]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00BDF8]"></div>
            </div>
        );
    }

    if (!clan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFBFD] p-4 text-center">
                <p className="text-gray-500 mb-4">클랜 정보를 불러올 수 없습니다.</p>
                <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#00BDF8] text-white rounded-xl text-sm font-bold">
                    돌아가기
                </button>
            </div>
        );
    }

    const latestNotice = notices.length > 0 ? notices[0] : null;
    const latestPost = topPosts.length > 0 ? topPosts[0] : null;

    return (
        <div className="min-h-screen bg-[#FAFBFD] font-['Pretendard','Inter',sans-serif] flex flex-col items-center">
            {/* Top Navigation Bar */}
            <div className="w-full max-w-lg sticky top-0 z-30 bg-[#FAFBFD]/95 backdrop-blur-md px-4 py-3.5 flex items-center border-b border-gray-100/80">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 -ml-1 text-[#0B1114] hover:text-[#00BDF8] transition-colors rounded-lg"
                >
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-[17px] font-bold text-[#0B1114] ml-2">클랜 상세</h1>
            </div>

            {/* Main Content Container (Responsive Width) */}
            <div className="w-full max-w-lg px-5 py-6 pb-24 space-y-6 flex-1">
                {/* ─────────────────────────────────────────────────────────────
                    영역 1. 클랜 프로필 관련 정보
                ───────────────────────────────────────────────────────────── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-4">
                        {/* Clan Avatar */}
                        <div
                            className={`relative w-[86px] h-[86px] rounded-full overflow-hidden bg-gray-100 border border-gray-100 shadow-sm shrink-0 flex items-center justify-center ${
                                myRole === '01' || myRole === '02' ? 'cursor-pointer group' : ''
                            }`}
                            onClick={handleEditClick}
                        >
                            {clan.attachFilePath ? (
                                <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                            ) : (
                                <DefaultProfile type="clan" iconSize={28} />
                            )}
                            {(myRole === '01' || myRole === '02') && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FaRegEdit className="text-white text-base" />
                                </div>
                            )}
                        </div>

                        {/* Clan Identity */}
                        <div className="flex-1 min-w-0 space-y-1">
                            <h2 className="text-[24px] font-bold text-[#0B1114] leading-tight truncate tracking-tight">
                                {clan.name}
                            </h2>
                            <p className="text-[14px] font-medium text-[#525252] leading-snug line-clamp-2">
                                {clan.description || '클랜 소개가 없습니다.'}
                            </p>
                        </div>
                    </div>

                    {/* Secondary Actions (단체 채팅 / 멤버 현황) */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                            onClick={() =>
                                navigate(`/main/chat/room/${id}`, {
                                    state: { roomNm: clan.name, roomType: 'CLAN', attachFilePath: clan.attachFilePath }
                                })
                            }
                            className="flex-1 h-[38px] bg-[#FAFBFD] hover:bg-[#f0f9fd] active:scale-[0.98] border border-[#00BDF8] rounded-[12px] flex items-center justify-center gap-2 text-[#0098CC] text-[15px] font-bold transition-all shadow-sm"
                        >
                            <MessageSquare size={16} className="text-[#00BDF8] shrink-0" />
                            <span>단체 채팅</span>
                            {clan.unreadChatCount !== undefined && clan.unreadChatCount > 0 && (
                                <span className="bg-[#FF5A5A] text-white text-[10px] font-bold rounded-full px-1.5 py-0.2 min-w-[16px] text-center leading-tight">
                                    {clan.unreadChatCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => navigate(`/main/clan/members/${id}`)}
                            className="flex-1 h-[38px] bg-[#FAFBFD] hover:bg-[#f0f9fd] active:scale-[0.98] border border-[#00BDF8] rounded-[12px] flex items-center justify-center gap-2 text-[#0098CC] text-[15px] font-bold transition-all shadow-sm"
                        >
                            <User size={16} className="text-[#00BDF8] shrink-0" />
                            <span>멤버 현황</span>
                        </button>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    영역 2. 공지사항
                ───────────────────────────────────────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-[#0B1114]">공지사항</h3>
                        <span
                            onClick={() => navigate(`/main/clan/notice/${id}`)}
                            className="text-[13px] font-medium text-[#525252] hover:text-[#00BDF8] cursor-pointer transition-colors"
                        >
                            더보기
                        </span>
                    </div>

                    <div
                        onClick={() => {
                            if (latestNotice) {
                                navigate(`/main/clan/notice/${id}/detail/${latestNotice.cnNoticeNo}`);
                            } else {
                                navigate(`/main/clan/notice/${id}`);
                            }
                        }}
                        className="bg-white border border-white shadow-[0px_2px_6px_rgba(11,17,20,0.06)] rounded-[12px] p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                    >
                        {/* Notice Icon Badge */}
                        <div className="w-9 h-9 rounded-full bg-[#FAFBFD] border border-[#00BDF8] flex items-center justify-center shrink-0 text-[#00BDF8]">
                            <FaBell size={16} />
                        </div>

                        {/* Notice Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                            {latestNotice ? (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        {latestNotice.pinYn === 'Y' && (
                                            <span className="text-[10px] font-bold bg-red-50 text-[#FF5A5A] px-1.5 py-0.5 rounded">
                                                중요
                                            </span>
                                        )}
                                        <h4 className="text-[14px] font-bold text-[#0B1114] truncate">
                                            {latestNotice.title}
                                        </h4>
                                    </div>
                                    <p className="text-[12px] font-medium text-[#525252] truncate">
                                        {latestNotice.content || '공지사항 내용을 확인해보세요.'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-[14px] font-bold text-[#0B1114]">등록된 공지가 없습니다.</h4>
                                    <p className="text-[12px] font-medium text-[#525252]">새 공지가 등록되면 이곳에서 확인할 수 있어요.</p>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    영역 3. 클랜 합주방
                ───────────────────────────────────────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-[#0B1114]">클랜 합주방</h3>
                        <span
                            onClick={() => navigate(`/main/clan/jam/${id}`)}
                            className="text-[13px] font-medium text-[#525252] hover:text-[#00BDF8] cursor-pointer transition-colors"
                        >
                            더보기
                        </span>
                    </div>

                    {recentJams.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
                            {recentJams.slice(0, 3).map((jam) => (
                                <div
                                    key={jam.id}
                                    onClick={() => {
                                        if (jam.member || jam.isMember) {
                                            navigate(`/main/clan/jam/room/${jam.id}`);
                                        } else {
                                            navigate(`/main/clan/jam/${id}`);
                                        }
                                    }}
                                    className="w-full bg-white border border-[#E5E5E5] rounded-[12px] overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    {/* Jam Thumbnail */}
                                    <div className="w-full aspect-square sm:h-[110px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                                        {jam.attachFilePath ? (
                                            <img
                                                src={jam.attachFilePath}
                                                alt={jam.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F3F9FB] text-[#00BDF8]">
                                                <Music size={26} className="opacity-60" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Jam Info Description */}
                                    <div className="p-2 min-h-[42px] flex flex-col justify-center">
                                        <h4 className="text-[11px] font-bold text-[#0B1114] leading-[14px] line-clamp-1">
                                            {jam.title}
                                        </h4>
                                        <p className="text-[9px] font-medium text-[#525252] leading-[12px] line-clamp-1 mt-0.5">
                                            {jam.songTitle || jam.artist || '자유 합주'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6 text-center text-xs text-gray-400">
                            개설된 합주방이 없습니다.
                        </div>
                    )}
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    영역 4. 클랜 게시판
                ───────────────────────────────────────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-[#0B1114]">클랜 게시판</h3>
                        <span
                            onClick={() => navigate(`/main/clan/board/${id}`)}
                            className="text-[13px] font-medium text-[#525252] hover:text-[#00BDF8] cursor-pointer transition-colors"
                        >
                            더보기
                        </span>
                    </div>

                    {latestPost ? (
                        <div
                            onClick={() =>
                                navigate(`/main/clan/board/${id}/${latestPost.cnBoardTypeNo}/post/${latestPost.cnBoardNo}`)
                            }
                            className="bg-white border border-[#ECECEC] rounded-[12px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                        >
                            {/* Header: Board Type & Title & Date */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-[#0098CC] text-[12px] font-bold shrink-0">
                                        {latestPost.boardTypeNm || '자유 게시판'}
                                    </span>
                                    <h4 className="text-[#2F2F31] text-[14px] font-semibold truncate">
                                        {latestPost.title}
                                    </h4>
                                </div>
                                <span className="text-[#737373] text-[10px] font-semibold shrink-0">
                                    {formatPostDate(latestPost.regDate)}
                                </span>
                            </div>

                            {/* Body: Content Preview */}
                            <p className="text-[#55575B] text-[14px] font-medium leading-[22px] line-clamp-2 whitespace-pre-line">
                                {latestPost.content || latestPost.title}
                            </p>

                            {/* Footer: Author & Counts */}
                            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    {latestPost.profileImageUrl ? (
                                        <img
                                            src={latestPost.profileImageUrl}
                                            alt=""
                                            className="w-[26px] h-[26px] rounded-full object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-[26px] h-[26px] rounded-full bg-gray-100 flex items-center justify-center border border-gray-100 overflow-hidden">
                                            <img src="/images/default_profile.png" alt="" className="w-full h-full object-cover opacity-60" />
                                        </div>
                                    )}
                                    <span className="text-[#2F2F31] text-[14px] font-semibold">
                                        {latestPost.userNickNm || '익명'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[#E40004]">
                                        <FaHeart size={11} />
                                        <span className="text-[12px] font-bold">{latestPost.boardLikeCnt || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#8E9196]">
                                        <FaRegCommentDots size={12} />
                                        <span className="text-[12px] font-bold">{latestPost.boardReplyCnt || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-[#ECECEC] rounded-[12px] p-6 text-center text-xs text-gray-400">
                            등록된 게시글이 없습니다.
                        </div>
                    )}
                </section>

                {/* ─────────────────────────────────────────────────────────────
                    영역 5. 클랜 캘린더
                ───────────────────────────────────────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-semibold text-[#0B1114]">클랜 캘린더</h3>
                        <span
                            onClick={() => navigate(`/main/clan/calendar/${id}`)}
                            className="text-[13px] font-medium text-[#525252] hover:text-[#00BDF8] cursor-pointer transition-colors"
                        >
                            캘린더 보기
                        </span>
                    </div>

                    <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex flex-col gap-4 shadow-sm">
                        {/* Week Navigator */}
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#202428]">{weekTitle}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handlePrevWeek}
                                    className="w-6 h-6 rounded bg-[#F4F6F8] hover:bg-gray-200 flex items-center justify-center text-[#626A72] text-[11px] transition-colors"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    onClick={handleNextWeek}
                                    className="w-6 h-6 rounded bg-[#F4F6F8] hover:bg-gray-200 flex items-center justify-center text-[#626A72] text-[11px] transition-colors"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>

                        {/* Week Days Row (일 ~ 토) */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {weekDays.map((day) => (
                                <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-[#8A9198]">{day.label}</span>
                                    <button
                                        onClick={() => setSelectedDateStr(day.dateStr)}
                                        className={`w-8 h-9 rounded-[10px] flex flex-col items-center justify-center transition-all ${
                                            day.isSelected
                                                ? 'bg-[#DDF6FC] text-[#0099C7] font-bold shadow-xs'
                                                : 'text-[#555C63] text-[13px] font-medium hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-[13px] leading-none">{day.dayNum}</span>
                                        {day.hasSchedule && (
                                            <span
                                                className={`w-1 h-1 rounded-full mt-0.5 ${
                                                    day.isSelected ? 'bg-[#00A6D6]' : 'bg-[#00BDF8]'
                                                }`}
                                            />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Selected Date Schedule Preview */}
                        <div className="pt-3 border-t border-gray-100">
                            {selectedSchedules.length > 0 ? (
                                <div className="space-y-2.5">
                                    {selectedSchedules.map((sch: any) => (
                                        <div
                                            key={sch.cnSchNo}
                                            onClick={() => navigate(`/main/clan/calendar/${id}`)}
                                            className="flex items-center gap-3.5 cursor-pointer group"
                                        >
                                            <div className="w-1 self-stretch bg-[#00BDF8] rounded-full min-h-[46px] group-hover:bg-[#0098CC] transition-colors shrink-0" />
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <h4 className="text-[16px] font-semibold text-[#0B1114] truncate">
                                                    {sch.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="bg-[#F2F5F7] rounded-[12px] px-2.5 py-1 flex items-center gap-1.5 text-[12px] text-[#525252] font-medium">
                                                        <FaRegClock size={11} className="text-[#00BDF8]" />
                                                        <span>{formatScheduleDate(sch.sttDate)}</span>
                                                    </div>
                                                    {sch.content && (
                                                        <div className="bg-[#F2F5F7] rounded-[12px] px-2.5 py-1 flex items-center gap-1.5 text-[12px] text-[#525252] font-medium truncate max-w-[180px]">
                                                            <span className="truncate">{sch.content}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-xs text-gray-400 py-2">
                                    선택한 날짜에 등록된 일정이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                클랜 정보 수정 모달
            ───────────────────────────────────────────────────────────── */}
            {isEditModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm px-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-lg animate-fade-in-up">
                        <h2 className="text-xl font-bold text-[#0B1114] mb-4 text-center">클랜 정보 수정</h2>

                        <div className="flex justify-center mb-6">
                            <div
                                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-100 overflow-hidden flex items-center justify-center cursor-pointer relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {editForm.previewUrl ? (
                                    <img src={editForm.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <DefaultProfile type="clan" iconSize={28} />
                                )}
                                <div className="absolute bottom-0 right-0 bg-[#00BDF8] text-white p-1.5 rounded-full">
                                    <FaRegEdit size={12} />
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#0B1114] mb-1">클랜 이름</label>
                                <input
                                    type="text"
                                    value={editForm.nm}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, nm: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    placeholder="클랜 이름을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#0B1114] mb-1">클랜 소개</label>
                                <textarea
                                    value={editForm.desc}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, desc: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8] h-24 resize-none"
                                    placeholder="클랜 소개를 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#0B1114] mb-1">URL (유튜브/참고자료)</label>
                                <input
                                    type="text"
                                    value={editForm.url}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
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
                                className="flex-1 bg-[#00BDF8] text-white font-bold py-3 rounded-xl hover:bg-[#00a6da] transition-colors"
                            >
                                수정완료
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 알림 / 확인 모달 */}
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

            {/* Gathering Modals (보존) */}
            {isGatheringCreateModalOpen && (
                <GatheringCreateModal
                    clanId={Number(id)}
                    userId={localStorage.getItem('userId') || ''}
                    onClose={() => setIsGatheringCreateModalOpen(false)}
                    onSubmit={() => {
                        window.location.reload();
                    }}
                />
            )}
            {isGatheringApplyModalOpen && selectedGathering && (
                <GatheringApplyModal
                    gathering={selectedGathering}
                    userId={localStorage.getItem('userId') || ''}
                    onClose={() => setIsGatheringApplyModalOpen(false)}
                    onSubmit={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default ClanDetail;
