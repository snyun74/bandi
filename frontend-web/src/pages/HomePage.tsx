import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JamEvaluationModal from "../components/common/JamEvaluationModal";
import ProfileEditModal from "../components/profile/ProfileEditModal";
import NoticePopup from "../components/notice/NoticePopup";
import DefaultProfile from "../components/common/DefaultProfile";
import { FaHeart, FaComment, FaChevronRight, FaPen } from 'react-icons/fa';
import iconJamCreate from '../assets/group4.png';
import iconJamSearch from '../assets/solar_music-notes-bold.png';
import iconNotice from '../assets/group3.png';
import iconCreate from '../assets/mynaui_file-plus-solid.png';

interface UpcomingSchedule {
    type: string;
    jamId: number;
    jamTitle: string;
    songTitle: string;
    artist: string;
    dDay: string;
    dateStr: string;
    studioName: string;
    statusLabel: string;
    participantCount: number;
    targetDate: string;
    isClan: string;
}

interface BandiTalkPost {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    content: string;
    regDate: string;
    writerUserId: string;
    userNickNm: string;
    profileImg: string | null;
    maskingYn?: string;
    likeCnt: number;
    commentCnt: number;
}

export default function HomePage() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId") || "";

    const requireAuth = (callback: () => void, customMsg?: { title?: string; description?: string }) => {
        if (!userId) {
            window.dispatchEvent(new CustomEvent('open-auth-modal', {
                detail: {
                    title: customMsg?.title || '로그인이 필요한 서비스예요 🎵',
                    description: customMsg?.description || '밴디에서 다양한 합주에 참여하고\n음악 친구들과 실시간으로 소통해 보세요!'
                }
            }));
            return;
        }
        callback();
    };

    // 메인 광고/배너 상태
    const [mainBanner, setMainBanner] = useState<{ url: string; isVideo: boolean; linkUrl: string | null } | null>(null);
    const [isBannerLoading, setIsBannerLoading] = useState(true);

    // 1 영역: 다가오는 예약
    const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
    const [currentUpcomingIndex, setCurrentUpcomingIndex] = useState(0);

    // 3 영역: 내 클랜 & 내 합주
    const [myClans, setMyClans] = useState<any[]>([]);
    const [currentClanIndex, setCurrentClanIndex] = useState(0);
    const [myJams, setMyJams] = useState<any[]>([]);
    const [currentJamIndex, setCurrentJamIndex] = useState(0);

    // 4 영역: 실시간 밴디톡
    const [bandiTalkPosts, setBandiTalkPosts] = useState<BandiTalkPost[]>([]);

    // 2 영역 '만들기' 모달 상태
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

    // 기존 모달 & 공지사항 유지
    const [pendingEvaluation, setPendingEvaluation] = useState<any>(null);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [activeNotices, setActiveNotices] = useState<any[]>([]);

    // 내 클랜 터치/마우스 스와이프 핸들러
    const clanTouchStartX = useRef<number | null>(null);
    const clanTouchEndX = useRef<number | null>(null);
    const isClanMoved = useRef(false);

    const handleClanPrev = () => {
        if (myClans.length <= 1) return;
        setCurrentClanIndex((prev) => (prev === 0 ? myClans.length - 1 : prev - 1));
    };

    const handleClanNext = () => {
        if (myClans.length <= 1) return;
        setCurrentClanIndex((prev) => (prev + 1) % myClans.length);
    };

    const onClanTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        clanTouchStartX.current = clientX;
        clanTouchEndX.current = clientX;
        isClanMoved.current = false;
    };

    const onClanTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (clanTouchStartX.current === null) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        clanTouchEndX.current = clientX;
        if (Math.abs(clientX - clanTouchStartX.current) > 10) {
            isClanMoved.current = true;
        }
    };

    const onClanTouchEnd = () => {
        if (clanTouchStartX.current !== null && clanTouchEndX.current !== null) {
            const distance = clanTouchStartX.current - clanTouchEndX.current;
            if (distance > 35) {
                handleClanNext();
            } else if (distance < -35) {
                handleClanPrev();
            }
        }
        clanTouchStartX.current = null;
        clanTouchEndX.current = null;
    };

    // 내 합주 터치/마우스 스와이프 핸들러
    const jamTouchStartX = useRef<number | null>(null);
    const jamTouchEndX = useRef<number | null>(null);
    const isJamMoved = useRef(false);

    const handleJamPrev = () => {
        if (myJams.length <= 1) return;
        setCurrentJamIndex((prev) => (prev === 0 ? myJams.length - 1 : prev - 1));
    };

    const handleJamNext = () => {
        if (myJams.length <= 1) return;
        setCurrentJamIndex((prev) => (prev + 1) % myJams.length);
    };

    const onJamTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        jamTouchStartX.current = clientX;
        jamTouchEndX.current = clientX;
        isJamMoved.current = false;
    };

    const onJamTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (jamTouchStartX.current === null) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        jamTouchEndX.current = clientX;
        if (Math.abs(clientX - jamTouchStartX.current) > 10) {
            isJamMoved.current = true;
        }
    };

    const onJamTouchEnd = () => {
        if (jamTouchStartX.current !== null && jamTouchEndX.current !== null) {
            const distance = jamTouchStartX.current - jamTouchEndX.current;
            if (distance > 35) {
                handleJamNext();
            } else if (distance < -35) {
                handleJamPrev();
            }
        }
        jamTouchStartX.current = null;
        jamTouchEndX.current = null;
    };

    useEffect(() => {
        fetchMainBanner();
        fetchBandiTalkPosts();
        if (userId) {
            fetchUpcomingSchedules();
            fetchMyClans();
            fetchMyJams();
            checkPendingEvaluation();
            checkProfileComplete();
            fetchActiveNotices();
        }

        const html = document.documentElement;
        html.style.scrollBehavior = 'smooth';
        return () => {
            html.style.scrollBehavior = '';
        };
    }, [userId]);

    // 메인 광고 배너 조회
    const fetchMainBanner = async () => {
        try {
            const res = await fetch('/api/admin/banners/MAIN');
            if (res.ok) {
                const data = await res.json();
                if (data.fileUrl) {
                    const isVideo = data.mimeType?.startsWith('video/') || data.fileUrl.match(/\.(mp4|webm|ogg)$/i) !== null;
                    setMainBanner({ url: data.fileUrl, isVideo, linkUrl: data.adBannerLinkUrl || null });
                }
            }
        } catch (error) {
            console.error("Failed to fetch main banner", error);
        } finally {
            setIsBannerLoading(false);
        }
    };

    // 1 영역: 다가오는 예약 API 호출
    const fetchUpcomingSchedules = async () => {
        try {
            const res = await fetch(`/api/bands/my-upcoming-schedules?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setUpcomingSchedules(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch upcoming schedules", e);
        }
    };

    // 3 영역: 내 클랜 조회
    const fetchMyClans = async () => {
        try {
            const res = await fetch(`/api/clans/my-list?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMyClans(data || []);
            }
        } catch (e) {
            console.error("Failed to fetch my clans", e);
        }
    };

    // 3 영역: 내 합주 조회 (자유합주 + 클랜합주)
    const fetchMyJams = async () => {
        try {
            const res = await fetch(`/api/bands/my?userId=${userId}&size=30`);
            if (res.ok) {
                const data = await res.json();
                setMyJams(data.content || []);
            }
        } catch (e) {
            console.error("Failed to fetch my jams", e);
        }
    };

    // 4 영역: 밴디톡 게시글 조회
    const fetchBandiTalkPosts = async () => {
        try {
            const res = await fetch('/api/boards/bandi-talk');
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setBandiTalkPosts(data);
                    return;
                }
            }
            // Fallback: 최근 게시글 API 호출
            const fallbackRes = await fetch('/api/boards/recent?size=2');
            if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                const posts = fallbackData.content || fallbackData || [];
                setBandiTalkPosts(posts.slice(0, 2).map((p: any) => ({
                    boardNo: p.boardNo,
                    boardTypeFg: p.boardTypeFg || "0",
                    title: p.title || "",
                    content: p.content || p.title || "",
                    regDate: p.regDate || p.insDtime || "",
                    writerUserId: p.writerUserId || "",
                    userNickNm: p.userNickNm || "익명",
                    profileImg: p.profileImg || null,
                    maskingYn: p.maskingYn || "N",
                    likeCnt: p.likeCnt || 0,
                    commentCnt: p.commentCnt || 0
                })));
            }
        } catch (e) {
            console.error("Failed to fetch bandi talk posts", e);
        }
    };



    // 기존 평가/프로필 검사
    const checkPendingEvaluation = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/bands/evaluation/pending?userId=${userId}`);
            if (response.ok) {
                if (response.status === 204) {
                    setPendingEvaluation(null);
                } else {
                    const data = await response.json();
                    setPendingEvaluation(data);
                }
            }
        } catch (error) {
            console.error("Failed to check pending evaluation", error);
        }
    };

    const checkProfileComplete = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/user/profile/${userId}`);
            if (res.ok) {
                const data = await res.json();
                const isIncomplete =
                    !data.genderCd || String(data.genderCd).trim() === '' || String(data.genderCd) === 'null' ||
                    !data.mbti || String(data.mbti).trim() === '' || String(data.mbti) === 'null' ||
                    !data.skillsConfigured;
                if (isIncomplete) {
                    setProfileIncomplete(true);
                }
            }
        } catch (e) {
            console.error("Failed to check profile", e);
        }
    };

    const fetchActiveNotices = async () => {
        try {
            const res = await fetch('/api/admin/notices/active');
            if (res.ok) {
                const data = await res.json();
                setActiveNotices(data);
            }
        } catch (error) {
            console.error("Failed to fetch active notices", error);
        }
    };

    // 날짜 포맷 YY.MM.DD (예: 26.03.12)
    const formatShortDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        const y = dateStr.substring(2, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

    const currentUpcoming = upcomingSchedules.length > 0
        ? upcomingSchedules[currentUpcomingIndex % upcomingSchedules.length]
        : null;

    const currentClan = myClans.length > 0
        ? myClans[currentClanIndex % myClans.length]
        : null;

    const currentJam = myJams.length > 0
        ? myJams[currentJamIndex % myJams.length]
        : null;

    return (
        <div className="flex flex-col pb-4 relative min-h-screen bg-[#F7F9FC] font-['Pretendard'] text-gray-900 selection:bg-[#00BDF8] selection:text-white">
            
            {/* ========================================================================= */}
            {/* 메인 광고 배너 영역 (헤더 바로 밑에 1mm도 미동 없는 완전 고정 Fixed) */}
            {/* ========================================================================= */}
            <div className="fixed top-[calc(var(--header-height)+var(--safe-top))] left-0 right-0 z-0 w-full flex justify-center pointer-events-auto">
                <section className="w-full max-w-lg aspect-[16/9] bg-[#003C48] overflow-hidden select-none flex items-center justify-center transform-gpu">
                    {isBannerLoading ? (
                        <div className="w-full h-full bg-slate-800 animate-pulse" />
                    ) : mainBanner ? (
                        mainBanner.linkUrl ? (
                            <a
                                href={mainBanner.linkUrl.startsWith('http') ? mainBanner.linkUrl : `http://${mainBanner.linkUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full block"
                            >
                                {mainBanner.isVideo ? (
                                    <video 
                                        src={mainBanner.url} 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover cursor-pointer transition-opacity duration-300" 
                                    />
                                ) : (
                                    <img 
                                        src={mainBanner.url} 
                                        alt="Main Banner" 
                                        className="w-full h-full object-cover cursor-pointer transition-opacity duration-300" 
                                    />
                                )}
                            </a>
                        ) : (
                            <div className="w-full h-full">
                                {mainBanner.isVideo ? (
                                    <video 
                                        src={mainBanner.url} 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover transition-opacity duration-300" 
                                    />
                                ) : (
                                    <img 
                                        src={mainBanner.url} 
                                        alt="Main Banner" 
                                        className="w-full h-full object-cover transition-opacity duration-300" 
                                    />
                                )}
                            </div>
                        )
                    ) : (
                        <img src="/images/main_logo.png" alt="Default Main Banner" className="w-full h-full object-cover" />
                    )}
                </section>
            </div>

            {/* ========================================================================= */}
            {/* 초기 100% 온전 노출을 위한 플레이스홀더 스페이서 */}
            {/* ========================================================================= */}
            <div className="w-full max-w-lg mx-auto aspect-[16/9] pointer-events-none invisible select-none" aria-hidden="true" />

            {/* ========================================================================= */}
            {/* 메인 컨텐츠 영역 (고정된 광고 위를 부드럽게 덮고 올라가는 구조) */}
            {/* ========================================================================= */}
            <div className="relative z-10 bg-[#F7F9FC] rounded-t-[28px] pt-6 pb-24 shadow-[0_-12px_32px_rgba(0,0,0,0.08)] min-h-screen">
                <div className="w-full max-w-lg mx-auto px-4 space-y-6">

                    {/* ========================================================================= */}
                    {/* 1 영역. 다가오는 예약 (피그마 100% 픽셀 퍼펙트) */}
                    {/* ========================================================================= */}
                    {currentUpcoming && (
                        <section className="animate-fadeIn">
                            <h2 className="text-[18px] font-bold leading-[26px] text-[#0B1114] mb-3">
                                다가오는 예약
                            </h2>

                            {/* 예약 카드 */}
                            <div className="bg-white rounded-[12px] p-4 border border-[#ECECEC] shadow-[0px_4px_10px_rgba(0,0,0,0.06)] relative transition-all duration-300">
                                
                                {/* 상단: [D-6] 뱃지 + 합주방명 및 하위 상세 정보 */}
                                <div className="flex items-start gap-2">
                                    {/* D-Day 다크 캡슐 뱃지 */}
                                    <span className="bg-[#2F2F31] text-white text-[12px] font-bold leading-[16px] px-[9px] py-[2px] rounded-full shrink-0 mt-0.5">
                                        {currentUpcoming.dDay}
                                    </span>

                                    {/* 합주방명 및 하단 텍스트들 */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <h3 className="text-[16px] font-bold leading-[22px] text-[#2F2F31] truncate">
                                            {currentUpcoming.jamTitle}
                                        </h3>
                                        <p className="text-[12px] font-semibold leading-[14px] text-[#8E9196]">
                                            {currentUpcoming.dateStr}
                                        </p>
                                        <p className="text-[12px] font-semibold leading-[14px] text-[#8E9196]">
                                            {currentUpcoming.studioName || '홍대 사운드랩'}
                                        </p>
                                        <p className="text-[12px] font-bold leading-[16px] text-[#1591DC]">
                                            {currentUpcoming.statusLabel} · {currentUpcoming.participantCount}명 참석
                                        </p>
                                    </div>
                                </div>

                                {/* 합주 내용 보기 버튼 (시안색 풀 버튼) */}
                                <button
                                    onClick={() => {
                                        if (currentUpcoming.isClan === 'Y') {
                                            navigate(`/main/clan/jam/room/${currentUpcoming.jamId}`);
                                        } else {
                                            navigate(`/main/jam/room/${currentUpcoming.jamId}`);
                                        }
                                    }}
                                    className="w-full h-[46px] bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-[0.99] text-[#FEFEFE] font-bold text-[14px] leading-[20px] rounded-[24px] shadow-sm transition-all flex items-center justify-center mt-4 cursor-pointer"
                                >
                                    합주 내용 보기
                                </button>
                            </div>

                            {/* 여러 건일 경우 페이지네이션 인디케이터 닷 */}
                            {upcomingSchedules.length > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-3">
                                    {upcomingSchedules.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentUpcomingIndex(idx)}
                                            className={`transition-all duration-300 rounded-full cursor-pointer ${
                                                idx === (currentUpcomingIndex % upcomingSchedules.length)
                                                    ? 'w-[8px] h-[8px] bg-[#00BDF8]'
                                                    : 'w-[6px] h-[6px] bg-[#E5E5E5]'
                                            }`}
                                            aria-label={`예약 ${idx + 1}번`}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* 2 영역. 4개 퀵 아이콘 그리드 */}
                    {/* ========================================================================= */}
                    <section>
                        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                            {/* 1. 합주 만들기 */}
                            <div
                                onClick={() => requireAuth(() => navigate('/main/jam/create'), {
                                    title: '합주를 직접 개설해 보세요! 🎸',
                                    description: '합주방을 만들고 멤버를 모집하려면\n로그인이 필요합니다.'
                                })}
                                className="bg-white rounded-[15px] p-1.5 min-[380px]:p-2.5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-[0px_5px_12.5px_rgba(0,0,0,0.06)] border-[1.25px] border-[#F5F5F5] hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-[32px] h-[32px] min-[380px]:w-[35px] min-[380px]:h-[35px] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={iconJamCreate} alt="합주 만들기" className="w-[26px] h-[26px] min-[380px]:w-[28px] min-[380px]:h-[28px] object-contain" />
                                </div>
                                <span className="text-[11px] min-[380px]:text-[12px] font-semibold leading-[18px] text-[#525252] text-center tracking-tighter min-[380px]:tracking-tight whitespace-nowrap">
                                    합주 만들기
                                </span>
                            </div>

                            {/* 2. 합주 찾기 */}
                            <div
                                onClick={() => requireAuth(() => navigate('/main/jam'), {
                                    title: '합주방을 둘러보세요! 🎵',
                                    description: '합주방 목록 및 상세 정보를 보시려면\n로그인이 필요합니다.'
                                })}
                                className="bg-white rounded-[15px] p-1.5 min-[380px]:p-2.5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-[0px_5px_12.5px_rgba(0,0,0,0.06)] border-[1.25px] border-[#F5F5F5] hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-[32px] h-[32px] min-[380px]:w-[35px] min-[380px]:h-[35px] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={iconJamSearch} alt="합주 찾기" className="w-[26px] h-[26px] min-[380px]:w-[28px] min-[380px]:h-[28px] object-contain" />
                                </div>
                                <span className="text-[11px] min-[380px]:text-[12px] font-semibold leading-[18px] text-[#525252] text-center tracking-tighter min-[380px]:tracking-tight whitespace-nowrap">
                                    합주 찾기
                                </span>
                            </div>

                            {/* 3. 공지사항 */}
                            <div
                                onClick={() => requireAuth(() => navigate('/main/notices'), {
                                    title: '공지사항을 확인해 보세요! 📢',
                                    description: '공지사항 목록 및 상세 내용을 보시려면\n로그인이 필요합니다.'
                                })}
                                className="bg-white rounded-[15px] p-1.5 min-[380px]:p-2.5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-[0px_5px_12.5px_rgba(0,0,0,0.06)] border-[1.25px] border-[#F5F5F5] hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-[32px] h-[32px] min-[380px]:w-[35px] min-[380px]:h-[35px] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={iconNotice} alt="공지사항" className="w-[26px] h-[26px] min-[380px]:w-[28px] min-[380px]:h-[28px] object-contain" />
                                </div>
                                <span className="text-[11px] min-[380px]:text-[12px] font-semibold leading-[18px] text-[#525252] text-center tracking-tighter min-[380px]:tracking-tight whitespace-nowrap">
                                    공지사항
                                </span>
                            </div>

                            {/* 4. 만들기 (쇼츠 & 게시물 등록 모달) */}
                            <div
                                onClick={() => requireAuth(() => setIsCreateMenuOpen(true), {
                                    title: '새로운 콘텐츠를 만들어 보세요! 🎥',
                                    description: '영상이나 게시글을 등록하려면\n로그인이 필요합니다.'
                                })}
                                className="bg-white rounded-[15px] p-1.5 min-[380px]:p-2.5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-[0px_5px_12.5px_rgba(0,0,0,0.06)] border-[1.25px] border-[#F5F5F5] hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-[32px] h-[32px] min-[380px]:w-[35px] min-[380px]:h-[35px] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={iconCreate} alt="만들기" className="w-[26px] h-[26px] min-[380px]:w-[28px] min-[380px]:h-[28px] object-contain" />
                                </div>
                                <span className="text-[11px] min-[380px]:text-[12px] font-semibold leading-[18px] text-[#525252] text-center tracking-tighter min-[380px]:tracking-tight whitespace-nowrap">
                                    만들기
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* 3 영역. 내 클랜 & 내 합주 (좌우 스와이프 제스처 및 클릭 이동 지원) */}
                    {/* ========================================================================= */}
                    <section className="grid grid-cols-2 gap-3">
                        {/* [좌측] 내 클랜 */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-[5px] h-[14px] bg-[#00BDF8] rounded-[10px] inline-block"></span>
                                    <h3 className="font-bold text-[18px] leading-[26px] text-[#0B1114]">내 클랜</h3>
                                </div>
                                <button
                                    onClick={() => requireAuth(() => navigate('/main/clan/my'))}
                                    className="text-[#737373] text-[13px] leading-[16px] hover:text-[#00BDF8] cursor-pointer"
                                >
                                    더보기
                                </button>
                            </div>

                            {currentClan ? (
                                <div
                                    onTouchStart={onClanTouchStart}
                                    onTouchMove={onClanTouchMove}
                                    onTouchEnd={onClanTouchEnd}
                                    onMouseDown={onClanTouchStart}
                                    onMouseMove={onClanTouchMove}
                                    onMouseUp={onClanTouchEnd}
                                    onClick={() => {
                                        if (isClanMoved.current) return;
                                        navigate(`/main/clan/detail/${currentClan.cnNo}`);
                                    }}
                                    className="cursor-pointer select-none group flex flex-col touch-pan-y active:scale-[0.99] transition-transform"
                                >
                                    <div className="w-full aspect-square rounded-[10px] overflow-hidden bg-gray-100 shadow-[1px_1px_5px_rgba(0,0,0,0.25)] relative flex items-center justify-center">
                                        {currentClan.attachFilePath ? (
                                            <img
                                                src={currentClan.attachFilePath}
                                                alt={currentClan.cnNm}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <DefaultProfile type="clan" iconSize={36} className="w-full h-full pointer-events-none" />
                                        )}

                                        {/* 여러 개일 때 스와이프 안내 인디케이터 */}
                                        {myClans.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                                                {currentClanIndex + 1}/{myClans.length}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[18px] leading-[26px] text-[#0B1114] truncate mt-2">
                                        {currentClan.cnNm}
                                    </h4>
                                    <p className="text-[13px] text-[#737373] truncate mt-0.5">
                                        {currentClan.cnDesc || '클랜 소개'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => requireAuth(() => navigate('/main/clan'), {
                                        title: '클랜에 참여해 보세요! 👥',
                                        description: '다양한 밴드 클랜 활동을 하려면\n로그인이 필요합니다.'
                                    })}
                                    className="w-full aspect-square rounded-[10px] border border-dashed border-gray-200 bg-white/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white transition-all"
                                >
                                    <p className="text-xs text-gray-500 font-medium">
                                        {userId ? '가입된 클랜이 없습니다.' : '클랜을 찾아보세요!'}
                                    </p>
                                    <span className="text-[12px] text-[#00BDF8] font-bold mt-1">
                                        {userId ? '클랜 찾기' : '클랜 둘러보기'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* [우측] 내 합주 */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-[5px] h-[14px] bg-[#00BDF8] rounded-[10px] inline-block"></span>
                                    <h3 className="font-bold text-[18px] leading-[26px] text-[#0B1114]">내 합주</h3>
                                </div>
                                <button
                                    onClick={() => requireAuth(() => navigate('/main/jam/my'))}
                                    className="text-[#737373] text-[13px] leading-[16px] hover:text-[#00BDF8] cursor-pointer"
                                >
                                    더보기
                                </button>
                            </div>

                            {currentJam ? (
                                <div
                                    onTouchStart={onJamTouchStart}
                                    onTouchMove={onJamTouchMove}
                                    onTouchEnd={onJamTouchEnd}
                                    onMouseDown={onJamTouchStart}
                                    onMouseMove={onJamTouchMove}
                                    onMouseUp={onJamTouchEnd}
                                    onClick={() => {
                                        if (isJamMoved.current) return;
                                        if (currentJam.bnType === 'CLAN') {
                                            navigate(`/main/clan/jam/room/${currentJam.bnNo}`);
                                        } else {
                                            navigate(`/main/jam/room/${currentJam.bnNo}`);
                                        }
                                    }}
                                    className="cursor-pointer select-none group flex flex-col touch-pan-y active:scale-[0.99] transition-transform"
                                >
                                    <div className="w-full aspect-square rounded-[10px] overflow-hidden bg-gray-100 shadow-[1px_1px_5px_rgba(0,0,0,0.25)] relative flex items-center justify-center">
                                        {currentJam.bnImg ? (
                                            <img
                                                src={currentJam.bnImg}
                                                alt={currentJam.bnNm}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <DefaultProfile type="jam" iconSize={36} className="w-full h-full pointer-events-none" />
                                        )}

                                        {/* 여러 개일 때 스와이프 안내 인디케이터 */}
                                        {myJams.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                                                {currentJamIndex + 1}/{myJams.length}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[18px] leading-[26px] text-[#0B1114] truncate mt-2">
                                        {currentJam.bnNm}
                                    </h4>
                                    <p className="text-[13px] text-[#737373] truncate mt-0.5">
                                        {currentJam.bnSongNm ? `${currentJam.bnSongNm} - ${currentJam.bnSingerNm}` : '합주곡 정보 없음'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => requireAuth(() => navigate('/main/jam'), {
                                        title: '합주에 참여해 보세요! 🎸',
                                        description: '내 합주 일정을 확인하고 참여하려면\n로그인이 필요합니다.'
                                    })}
                                    className="w-full aspect-square rounded-[10px] border border-dashed border-gray-200 bg-white/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white transition-all"
                                >
                                    <p className="text-xs text-gray-500 font-medium leading-tight">
                                        {userId ? '참여 중인 합주가 없습니다.' : '내가 원하는 곡으로 합주해보세요!'}
                                    </p>
                                    <span className="text-[12px] text-[#00BDF8] font-bold mt-1">
                                        {userId ? '합주방 둘러보기' : '합주방 둘러보기'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* 4 영역. 밴드 합주의 모든 이야기 실시간 밴디톡 */}
                    {/* ========================================================================= */}
                    <section className="pt-2">
                        <div className="mb-3">
                            <h2 className="text-[18px] font-bold leading-[26px] text-[#0B1114]">
                                밴드 합주의 모든 이야기
                            </h2>
                            <h2 className="text-[18px] font-bold leading-[26px] text-[#0B1114]">
                                실시간 밴디톡
                            </h2>
                        </div>

                        {/* 피드 카드 목록 */}
                        <div className="space-y-3">
                            {bandiTalkPosts.length === 0 ? (
                                <div className="bg-white rounded-[12px] p-6 text-center text-gray-400 text-xs border border-[#ECECEC]">
                                    아직 등록된 게시글이 없습니다.
                                </div>
                            ) : (
                                bandiTalkPosts.map((post) => (
                                    <div
                                        key={post.boardNo}
                                        onClick={() => requireAuth(() => navigate(`/main/board/detail/${post.boardNo}`), {
                                            title: '밴디톡 이야기를 더 자세히 확인해 보세요! 💬',
                                            description: '게시글 상세 내용과 댓글을 확인하려면\n로그인이 필요합니다.'
                                        })}
                                        className="bg-white rounded-[12px] p-[16px_20px] border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-gray-300 transition-all space-y-3"
                                    >
                                        {/* 상단: 카테고리 뱃지 + 제목 + 작성일 */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-[#0098CC] text-[12px] font-bold leading-[14px] shrink-0">
                                                    {post.boardTypeFg === '1' ? '초보자게시판' : '자유게시판'}
                                                </span>
                                                <h4 className="text-[14px] font-semibold leading-[18px] text-[#2F2F31] truncate">
                                                    {post.title}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-semibold leading-[14px] text-[#737373] shrink-0">
                                                {formatShortDate(post.regDate)}
                                            </span>
                                        </div>

                                        {/* 본문 미리보기 (2줄 말줄임) */}
                                        <p className="text-[14px] font-medium leading-[22px] text-[#55575B] line-clamp-2 whitespace-pre-wrap">
                                            {post.content}
                                        </p>

                                        {/* 하단: 작성자 프로필 + 좋아요/댓글 수 */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-[26px] h-[26px] rounded-full overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center bg-gray-100">
                                                    {post.maskingYn !== 'Y' && post.profileImg ? (
                                                        <img
                                                            src={post.profileImg}
                                                            alt={post.userNickNm}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <DefaultProfile type="user" iconSize={12} className="w-full h-full" />
                                                    )}
                                                </div>
                                                <span className="text-[14px] font-semibold leading-[18px] text-[#2F2F31]">
                                                    {post.maskingYn === 'Y' ? '익명' : (post.userNickNm || '익명')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-[12px] font-bold text-[#E40004]">
                                                    <FaHeart size={11} className="text-[#E40004]" />
                                                    {post.likeCnt || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-[12px] font-bold text-[#8E9196]">
                                                    <FaComment size={11} className="text-[#D9D9DB]" />
                                                    {post.commentCnt || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 밴디톡 전체보기 링크 */}
                        <div
                            onClick={() => requireAuth(() => navigate('/main/board'), {
                                title: '밴디톡 전체보기를 이용해 보세요! 📝',
                                description: '커뮤니티 게시판을 보시려면\n로그인이 필요합니다.'
                            })}
                            className="flex items-center justify-center gap-1 py-4 text-[13px] font-medium leading-[20px] text-[#525252] cursor-pointer hover:text-[#00BDF8] transition-colors"
                        >
                            <span>전체보기</span>
                            <FaChevronRight size={10} className="text-[#737373]" />
                        </div>
                    </section>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 우하단 플로팅 글쓰기 FAB 버튼 (자유게시판 글쓰기 이동) */}
            {/* ========================================================================= */}
            <button
                onClick={() => requireAuth(() => navigate('/main/board/write/0'), {
                    title: '밴디톡에 글을 남겨보세요! ✍️',
                    description: '자유롭게 소통하고 질문하려면\n로그인이 필요합니다.'
                })}
                className="fixed bottom-[calc(var(--nav-height)+var(--safe-bottom)+18px)] right-4 md:right-[max(1.25rem,calc((100vw-480px)/2+1.25rem))] w-[48px] h-[48px] rounded-full bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all z-40"
                aria-label="글쓰기"
            >
                <FaPen size={17} />
            </button>

            {/* ========================================================================= */}
            {/* 2 영역 '만들기' 선택 바텀시트 / 모달 (피그마 캡처 디자인 100% 일치) */}
            {/* ========================================================================= */}
            {isCreateMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center"
                    onClick={() => setIsCreateMenuOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-[24px] p-6 pb-8 space-y-4 shadow-2xl animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-[18px] font-bold leading-[26px] text-[#0B1114] text-center mb-4">
                            새 콘텐츠 만들기
                        </h3>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                    navigate('/main/profile/shorts/create');
                                }}
                                className="w-full py-3.5 rounded-full border-2 border-[#00BDF8] text-[#00BDF8] font-bold text-[15px] leading-tight hover:bg-[#E6F8FE] active:scale-[0.99] transition-all cursor-pointer text-center block"
                            >
                                릴스 만들기 (동영상)
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                    navigate('/main/profile/post/create');
                                }}
                                className="w-full py-3.5 rounded-full border-2 border-[#00BDF8] text-[#00BDF8] font-bold text-[15px] leading-tight hover:bg-[#E6F8FE] active:scale-[0.99] transition-all cursor-pointer text-center block"
                            >
                                게시물 만들기 (사진/동영상)
                            </button>
                        </div>

                        <p className="text-center text-[12px] text-[#8E9196] font-medium pt-2">
                            만들고 싶은 콘텐츠 유형을 선택해주세요.
                        </p>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 시스템 팝업 / 모달들 (프로필 미입력, 합주 평가, 공지 팝업) */}
            {/* ========================================================================= */}
            {profileIncomplete && (
                <ProfileEditModal
                    isOpen={profileIncomplete}
                    onClose={() => setProfileIncomplete(false)}
                    userId={userId}
                    onProfileUpdate={() => setProfileIncomplete(false)}
                />
            )}
            {!profileIncomplete && pendingEvaluation && (
                <JamEvaluationModal
                    evaluation={pendingEvaluation}
                    onComplete={() => {
                        setPendingEvaluation(null);
                        checkPendingEvaluation();
                    }}
                />
            )}
            {activeNotices.length > 0 && (
                <NoticePopup
                    notices={activeNotices}
                    onClose={() => setActiveNotices([])}
                />
            )}
        </div>
    );
}
