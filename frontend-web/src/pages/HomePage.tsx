import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JamEvaluationModal from "../components/common/JamEvaluationModal";
import ProfileEditModal from "../components/profile/ProfileEditModal";
import NoticePopup from "../components/notice/NoticePopup";
import DefaultProfile from "../components/common/DefaultProfile";
import { FaHeart, FaComment, FaChevronRight, FaPen, FaSearch, FaBullhorn } from 'react-icons/fa';
import { HiPlus } from 'react-icons/hi';

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

    // 클랜 3초 자동 회전
    useEffect(() => {
        if (myClans.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentClanIndex(prev => (prev + 1) % myClans.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [myClans]);

    // 합주 3초 자동 회전
    useEffect(() => {
        if (myJams.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentJamIndex(prev => (prev + 1) % myJams.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [myJams]);

    // 다가오는 예약 다중 건일 경우 4초 자동 회전
    useEffect(() => {
        if (upcomingSchedules.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentUpcomingIndex(prev => (prev + 1) % upcomingSchedules.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [upcomingSchedules]);

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
            {/* 메인 광고 배너 영역 (16:9 비율 유지) */}
            {/* ========================================================================= */}
            <section className="sticky top-[60px] z-0 w-full aspect-[16/9] bg-[#003C48] overflow-hidden flex items-center justify-center">
                {isBannerLoading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                ) : mainBanner ? (
                    mainBanner.linkUrl ? (
                        <a
                            href={mainBanner.linkUrl.startsWith('http') ? mainBanner.linkUrl : `http://${mainBanner.linkUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-full"
                        >
                            {mainBanner.isVideo ? (
                                <video src={mainBanner.url} autoPlay loop muted playsInline className="w-full h-full object-cover cursor-pointer" />
                            ) : (
                                <img src={mainBanner.url} alt="Main Banner" className="w-full h-full object-cover cursor-pointer" />
                            )}
                        </a>
                    ) : (
                        <div className="w-full h-full">
                            {mainBanner.isVideo ? (
                                <video src={mainBanner.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                            ) : (
                                <img src={mainBanner.url} alt="Main Banner" className="w-full h-full object-cover" />
                            )}
                        </div>
                    )
                ) : (
                    <img src="/images/main_logo.png" alt="Default Main Banner" className="w-full h-full object-cover" />
                )}
            </section>

            {/* ========================================================================= */}
            {/* 메인 컨텐츠 영역 (배너 위로 부드럽게 스크롤) */}
            {/* ========================================================================= */}
            <div className="relative z-10 bg-[#F7F9FC] rounded-t-3xl pt-5 pb-24 shadow-[0_-10px_20px_rgba(0,0,0,0.04)]">
                <div className="max-w-md mx-auto px-4 space-y-6">

                    {/* ========================================================================= */}
                    {/* 1 영역. 다가오는 예약 (캡처와 글자 위치, 색감 100% 동일 구현) */}
                    {/* ========================================================================= */}
                    {currentUpcoming && (
                        <section className="animate-fadeIn">
                            <h2 className="text-[18px] font-bold text-[#111827] mb-3 tracking-tight">
                                다가오는 예약
                            </h2>

                            {/* 예약 카드 */}
                            <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/90 relative transition-all duration-300">
                                
                                {/* 상단: [D-6] 뱃지 + 합주방명 및 하위 상세 정보 (들여쓰기 정렬) */}
                                <div className="flex items-start gap-2.5">
                                    {/* D-Day 다크 캡슐 뱃지 */}
                                    <span className="bg-[#2A2E37] text-white text-[12px] font-extrabold px-3 py-0.5 rounded-full shrink-0 tracking-wider mt-0.5 shadow-xs">
                                        {currentUpcoming.dDay}
                                    </span>

                                    {/* 합주방명 및 하단 텍스트들 */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="text-[16px] font-bold text-[#1E2024] truncate leading-tight">
                                            {currentUpcoming.jamTitle}
                                        </h3>
                                        <p className="text-[13px] font-medium text-[#7E8B9B] leading-snug">
                                            {currentUpcoming.dateStr}
                                        </p>
                                        <p className="text-[13px] font-medium text-[#7E8B9B] leading-snug">
                                            {currentUpcoming.studioName || '합주실'}
                                        </p>
                                        <p className="text-[13px] font-bold text-[#00BDF8] leading-snug">
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
                                    className="w-full bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-[0.99] text-white font-bold py-3.5 rounded-full text-[15px] shadow-sm transition-all text-center block mt-5"
                                >
                                    합주 내용 보기
                                </button>
                            </div>

                            {/* 여러 건일 경우 페이지네이션 인디케이터 닷 */}
                            {upcomingSchedules.length > 1 && (
                                <div className="flex justify-center items-center gap-1.5 mt-3">
                                    {upcomingSchedules.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentUpcomingIndex(idx)}
                                            className={`transition-all duration-300 rounded-full ${
                                                idx === (currentUpcomingIndex % upcomingSchedules.length)
                                                    ? 'w-2 h-2 bg-[#00BDF8]'
                                                    : 'w-1.5 h-1.5 bg-[#E2E8F0]'
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
                        <div className="grid grid-cols-4 gap-2.5">
                            {/* 1. 합주 만들기 */}
                            <div
                                onClick={() => navigate('/main/jam/create')}
                                className="bg-white rounded-2xl p-3 py-3.5 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E6F8FE] text-[#00BDF8] group-hover:scale-105 transition-transform">
                                    <span className="font-black text-lg italic leading-none font-serif text-[#00BDF8]">B</span>
                                </div>
                                <span className="text-[11.5px] font-bold text-gray-700 text-center tracking-tight">
                                    합주 만들기
                                </span>
                            </div>

                            {/* 2. 합주 찾기 */}
                            <div
                                onClick={() => navigate('/main/jam')}
                                className="bg-white rounded-2xl p-3 py-3.5 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E6F8FE] text-[#00BDF8] group-hover:scale-105 transition-transform">
                                    <FaSearch size={15} />
                                </div>
                                <span className="text-[11.5px] font-bold text-gray-700 text-center tracking-tight">
                                    합주 찾기
                                </span>
                            </div>

                            {/* 3. 공지사항 */}
                            <div
                                onClick={() => navigate('/main/notices')}
                                className="bg-white rounded-2xl p-3 py-3.5 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E6F8FE] text-[#00BDF8] group-hover:scale-105 transition-transform">
                                    <FaBullhorn size={15} />
                                </div>
                                <span className="text-[11.5px] font-bold text-gray-700 text-center tracking-tight">
                                    공지사항
                                </span>
                            </div>

                            {/* 4. 만들기 (쇼츠 & 게시물 등록 모달) */}
                            <div
                                onClick={() => setIsCreateMenuOpen(true)}
                                className="bg-white rounded-2xl p-3 py-3.5 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-[#00BDF8]/40 hover:shadow-md transition-all cursor-pointer group active:scale-95"
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#E6F8FE] text-[#00BDF8] group-hover:scale-105 transition-transform">
                                    <div className="w-4 h-4 border-2 border-[#00BDF8] rounded-[4px] flex items-center justify-center">
                                        <HiPlus size={10} className="stroke-[2.5]" />
                                    </div>
                                </div>
                                <span className="text-[11.5px] font-bold text-gray-700 text-center tracking-tight">
                                    만들기
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* 3 영역. 내 클랜 & 내 합주 (2열 나란히 구성) */}
                    {/* ========================================================================= */}
                    <section className="grid grid-cols-2 gap-3.5">
                        {/* [좌측] 내 클랜 */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-3.5 bg-[#00BDF8] rounded-full inline-block"></span>
                                    <h3 className="font-bold text-[14px] text-gray-900">내 클랜</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/main/clan/my')}
                                    className="text-gray-400 text-xs hover:text-[#00BDF8] cursor-pointer"
                                >
                                    더보기
                                </button>
                            </div>

                            {currentClan ? (
                                <div
                                    onClick={() => navigate(`/main/clan/detail/${currentClan.cnNo}`)}
                                    className="cursor-pointer group flex flex-col"
                                >
                                    <div className="w-full aspect-square rounded-[20px] overflow-hidden bg-gray-100 shadow-sm border border-gray-100/60 relative flex items-center justify-center">
                                        {currentClan.attachFilePath ? (
                                            <img
                                                src={currentClan.attachFilePath}
                                                alt={currentClan.cnNm}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <DefaultProfile type="clan" iconSize={36} className="w-full h-full" />
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[14px] text-gray-900 truncate mt-2 leading-tight">
                                        {currentClan.cnNm}
                                    </h4>
                                    <p className="text-[11.5px] text-gray-500 truncate mt-0.5">
                                        {currentClan.cnDesc || '클랜 소개'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => navigate('/main/clan')}
                                    className="w-full aspect-square rounded-[20px] border border-dashed border-gray-200 bg-white/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white transition-all shadow-2xs"
                                >
                                    <p className="text-xs text-gray-400 font-medium">가입된 클랜이 없습니다.</p>
                                    <span className="text-[11px] text-[#00BDF8] font-bold mt-1">클랜 찾기</span>
                                </div>
                            )}
                        </div>

                        {/* [우측] 내 합주 */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-3.5 bg-[#00BDF8] rounded-full inline-block"></span>
                                    <h3 className="font-bold text-[14px] text-gray-900">내 합주</h3>
                                </div>
                                <button
                                    onClick={() => navigate('/main/jam/my')}
                                    className="text-gray-400 text-xs hover:text-[#00BDF8] cursor-pointer"
                                >
                                    더보기
                                </button>
                            </div>

                            {currentJam ? (
                                <div
                                    onClick={() => {
                                        if (currentJam.bnType === 'CLAN') {
                                            navigate(`/main/clan/jam/room/${currentJam.bnNo}`);
                                        } else {
                                            navigate(`/main/jam/room/${currentJam.bnNo}`);
                                        }
                                    }}
                                    className="cursor-pointer group flex flex-col"
                                >
                                    <div className="w-full aspect-square rounded-[20px] overflow-hidden bg-gray-100 shadow-sm border border-gray-100/60 relative flex items-center justify-center">
                                        {currentJam.bnImg ? (
                                            <img
                                                src={currentJam.bnImg}
                                                alt={currentJam.bnNm}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <DefaultProfile type="jam" iconSize={36} className="w-full h-full" />
                                        )}
                                    </div>
                                    <h4 className="font-bold text-[14px] text-gray-900 truncate mt-2 leading-tight">
                                        {currentJam.bnNm}
                                    </h4>
                                    <p className="text-[11.5px] text-gray-500 truncate mt-0.5">
                                        {currentJam.bnSongNm ? `${currentJam.bnSongNm} - ${currentJam.bnSingerNm}` : '합주곡 정보 없음'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => navigate('/main/jam')}
                                    className="w-full aspect-square rounded-[20px] border border-dashed border-gray-200 bg-white/60 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white transition-all shadow-2xs"
                                >
                                    <p className="text-xs text-gray-400 font-medium">참여 중인 합주가 없습니다.</p>
                                    <span className="text-[11px] text-[#00BDF8] font-bold mt-1">합주방 둘러보기</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* 4 영역. 밴드 합주의 모든 이야기 실시간 밴디톡 */}
                    {/* ========================================================================= */}
                    <section className="pt-2">
                        <div className="mb-3.5">
                            <p className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">
                                밴드 합주의 모든 이야기
                            </p>
                            <h2 className="text-[18px] font-extrabold text-gray-900 leading-tight tracking-tight">
                                실시간 밴디톡
                            </h2>
                        </div>

                        {/* 피드 카드 목록 */}
                        <div className="space-y-3">
                            {bandiTalkPosts.length === 0 ? (
                                <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-xs shadow-sm border border-gray-100">
                                    아직 등록된 게시글이 없습니다.
                                </div>
                            ) : (
                                bandiTalkPosts.map((post) => (
                                    <div
                                        key={post.boardNo}
                                        onClick={() => navigate(`/main/board/detail/${post.boardNo}`)}
                                        className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 cursor-pointer hover:border-gray-200 transition-all space-y-2"
                                    >
                                        {/* 상단: 카테고리 뱃지 + 제목 + 작성일 */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                <span className="text-[#00BDF8] text-[12px] font-bold shrink-0">
                                                    {post.boardTypeFg === '1' ? '초보자 게시판' : '자유 게시판'}
                                                </span>
                                                <h4 className="text-[13px] font-bold text-gray-900 truncate">
                                                    {post.title}
                                                </h4>
                                            </div>
                                            <span className="text-[11px] text-gray-400 shrink-0 font-medium">
                                                {formatShortDate(post.regDate)}
                                            </span>
                                        </div>

                                        {/* 본문 미리보기 (2줄 말줄임) */}
                                        <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-wrap font-normal">
                                            {post.content}
                                        </p>

                                        {/* 하단: 작성자 프로필 + 좋아요/댓글 수 */}
                                        <div className="flex items-center justify-between pt-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center bg-gray-100">
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
                                                        <DefaultProfile type="user" iconSize={10} className="w-full h-full" />
                                                    )}
                                                </div>
                                                <span className="text-[12px] text-gray-700 font-medium">
                                                    {post.maskingYn === 'Y' ? '익명' : (post.userNickNm || '익명')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-[11px]">
                                                <span className="flex items-center gap-1 text-red-500 font-semibold">
                                                    <FaHeart size={10} className="text-red-500" />
                                                    {post.likeCnt || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-400 font-medium">
                                                    <FaComment size={10} className="text-gray-300" />
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
                            onClick={() => navigate('/main/board')}
                            className="flex items-center justify-center gap-1.5 py-4 text-[13px] font-semibold text-gray-700 cursor-pointer hover:text-[#00BDF8] transition-colors"
                        >
                            <span>밴디톡 전체보기</span>
                            <FaChevronRight size={10} className="text-gray-400" />
                        </div>
                    </section>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 우하단 플로팅 글쓰기 FAB 버튼 (자유게시판 글쓰기 이동) */}
            {/* ========================================================================= */}
            <button
                onClick={() => navigate('/main/board/write/0')}
                className="fixed bottom-[calc(var(--nav-offset)+20px)] right-4 md:right-[max(1.25rem,calc((100vw-480px)/2+1.25rem))] w-[48px] h-[48px] rounded-full bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all z-20"
                aria-label="글쓰기"
            >
                <FaPen size={17} />
            </button>

            {/* ========================================================================= */}
            {/* 2 영역 '만들기' 선택 바텀시트 / 모달 */}
            {/* ========================================================================= */}
            {isCreateMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end justify-center"
                    onClick={() => setIsCreateMenuOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4 shadow-2xl animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
                        <h3 className="text-base font-bold text-gray-900 text-center">만들기</h3>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                    navigate('/main/profile/post/create');
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-cyan-50 border border-gray-100 hover:border-[#00BDF8]/40 transition-all"
                            >
                                <span className="text-2xl mb-1">📝</span>
                                <span className="text-sm font-bold text-gray-800">게시물 만들기</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreateMenuOpen(false);
                                    navigate('/main/profile/shorts/create');
                                }}
                                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-cyan-50 border border-gray-100 hover:border-[#00BDF8]/40 transition-all"
                            >
                                <span className="text-2xl mb-1">🎬</span>
                                <span className="text-sm font-bold text-gray-800">쇼츠 만들기</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCreateMenuOpen(false)}
                            className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-800 text-center"
                        >
                            닫기
                        </button>
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
