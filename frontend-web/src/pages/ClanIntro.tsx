import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    FaChevronLeft, 
    FaUserPlus, 
    FaClock, 
    FaExclamationCircle, 
    FaArrowRight, 
    FaExternalLinkAlt, 
    FaMusic,
    FaYoutube,
    FaPlay
} from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';
import CommonModal from '../components/common/CommonModal';

interface ClanIntroData {
    id: number;
    name: string;
    description: string;
    cnUrl: string;
    logoColor: string;
    logoText: string;
    attachFilePath?: string;
}

const ClanIntro: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clan, setClan] = useState<ClanIntroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [joinStatus, setJoinStatus] = useState<string>('NONE');

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    useEffect(() => {
        const fetchClanDetail = async () => {
            if (!id) return;
            const userId = localStorage.getItem('userId');

            try {
                // Fetch Clan Detail
                const response = await fetch(`/api/clans/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setClan({
                        id: data.cnNo,
                        name: data.cnNm,
                        description: data.cnDesc,
                        cnUrl: data.cnUrl,
                        logoColor: "bg-black",
                        logoText: data.cnNm ? data.cnNm.substring(0, 1) : "?",
                        attachFilePath: data.attachFilePath
                    });
                }

                // Fetch Join Status
                if (userId) {
                    const statusRes = await fetch(`/api/clans/${id}/status?userId=${userId}`);
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        setJoinStatus(statusData.status);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch clan info", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClanDetail();
    }, [id]);

    const handleJoinRequest = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert('로그인이 필요합니다.');
            return;
        }

        if (!id) return;

        try {
            const response = await fetch('/api/clans/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cnNo: Number(id),
                    userId: userId
                }),
            });

            if (response.ok) {
                showAlert('가입 신청이 완료되었습니다.');
                setJoinStatus('RQ'); // Update status immediately
            } else {
                const errorData = await response.json();
                showAlert(errorData.message || '가입 신청에 실패했습니다.');
            }
        } catch (error) {
            console.error("Failed to request join", error);
            showAlert('가입 신청 중 오류가 발생했습니다.');
        }
    };

    /**
     * 모바일 공유 링크(?si=), 쇼츠, 라이브 등 모든 형태의 유튜브 Video ID 추출
     */
    const getYoutubeVideoId = (url?: string): string => {
        if (!url) return '';
        const cleanUrl = url.trim();

        const standardMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/i);
        if (standardMatch && standardMatch[1]) return standardMatch[1];

        const shortMatch = cleanUrl.match(/youtu\.be\/([^"&?\/\s]{11})/i);
        if (shortMatch && shortMatch[1]) return shortMatch[1];

        if (cleanUrl.includes('/shorts/')) {
            const shortsMatch = cleanUrl.match(/shorts\/([^"&?\/\s]{11})/i);
            if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
        }

        if (cleanUrl.includes('/live/')) {
            const liveMatch = cleanUrl.match(/live\/([^"&?\/\s]{11})/i);
            if (liveMatch && liveMatch[1]) return liveMatch[1];
        }

        return '';
    };

    /**
     * 유튜브 채널명 또는 핸들(@channel) 추출
     */
    const getYoutubeChannelName = (url?: string): string => {
        if (!url) return 'YouTube 공식 채널';
        const cleanUrl = url.trim();

        // 1. @핸들 매칭 (예: youtube.com/@bandicon)
        const handleMatch = cleanUrl.match(/@([a-zA-Z0-9_\-\.]+)/);
        if (handleMatch && handleMatch[1]) {
            return `@${handleMatch[1]}`;
        }

        // 2. /c/ 또는 /user/ 사용자 지정 URL 매칭
        const customMatch = cleanUrl.match(/(?:c|user)\/([a-zA-Z0-9_\-\.]+)/i);
        if (customMatch && customMatch[1]) {
            return customMatch[1];
        }

        return 'YouTube 공식 채널';
    };

    /**
     * 모바일 공유 링크(?si=), 쇼츠, 라이브 등 모든 형태의 유튜브 URL 파싱
     */
    const getEmbedUrl = (url: string) => {
        const videoId = getYoutubeVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;
        }
        return url ? url.trim() : '';
    };

    /**
     * 외부 URL(YouTube, 인스타그램 등) 안전한 링크 생성
     */
    const getSafeExternalUrl = (url?: string) => {
        const target = url || clan?.cnUrl;
        if (!target) return '#';
        const cleanUrl = target.trim();
        return cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
            ? cleanUrl
            : `https://${cleanUrl}`;
    };

    /**
     * 외부 링크 열기 핸들러 (앱 화면이 외부 페이지로 변경되는 것 방지)
     */
    const handleOpenUrl = (url?: string) => {
        const targetUrl = getSafeExternalUrl(url);
        if (!targetUrl || targetUrl === '#') return;

        // 1. React Native WebView 앱 환경인 경우: 네이티브 앱에 외부 브라우저/YouTube 앱 실행 요청
        if ((window as any).ReactNativeWebView) {
            try {
                (window as any).ReactNativeWebView.postMessage(
                    JSON.stringify({ type: 'OPEN_EXTERNAL_URL', url: targetUrl })
                );
                return;
            } catch (e) {
                console.warn("ReactNativeWebView postMessage failed", e);
            }
        }

        // 2. 일반 웹 브라우저 환경: 새 탭/새 창으로 열기 (현재 밴디콘 앱 화면 유지)
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    /**
     * 가입 신청 액션 버튼
     */
    const renderActionButton = () => {
        if (joinStatus === 'RQ') {
            return (
                <button
                    disabled
                    className="w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
                >
                    <FaClock size={14} />
                    <span>승인 대기 중</span>
                </button>
            );
        } else if (joinStatus === 'RJ') {
            return (
                <button
                    onClick={handleJoinRequest}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                    <FaExclamationCircle size={14} />
                    <span>승인 거절 (다시 신청하기)</span>
                </button>
            );
        } else if (joinStatus === 'CN') {
            return (
                <button
                    onClick={() => navigate(`/main/clan/detail/${id}`)}
                    className="w-full py-3 bg-[#003C48] hover:bg-[#002B34] text-white rounded-xl font-bold text-sm shadow-md shadow-[#003C48]/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                    <span>클랜 홈 바로가기</span>
                    <FaArrowRight size={13} />
                </button>
            );
        } else {
            return (
                <button
                    onClick={handleJoinRequest}
                    className="w-full py-3 bg-gradient-to-r from-[#00BDF8] to-[#0098E0] hover:from-[#00a6da] hover:to-[#0086c8] text-white rounded-xl font-bold text-sm shadow-md shadow-[#00BDF8]/25 active:scale-98 transition-all flex items-center justify-center"
                >
                    <span>클랜 가입 신청하기</span>
                </button>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
                <div className="w-7 h-7 border-3 border-[#00BDF8] border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium">클랜 정보를 불러오는 중...</span>
            </div>
        );
    }

    if (!clan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-500 px-4">
                <p className="text-base font-bold mb-3">클랜 정보를 찾을 수 없습니다.</p>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                    이전으로 돌아가기
                </button>
            </div>
        );
    }

    const hasVideoOrUrl = !!(clan.cnUrl && clan.cnUrl.trim() !== '');
    const cleanUrl = clan.cnUrl ? clan.cnUrl.trim() : '';
    const isYoutubeUrl = hasVideoOrUrl && (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be'));
    const youtubeVideoId = hasVideoOrUrl ? getYoutubeVideoId(clan.cnUrl) : '';
    const isYouTubeVideo = !!youtubeVideoId;
    const isYouTubeChannel = isYoutubeUrl && !isYouTubeVideo;

    return (
        <div 
            className="flex flex-col bg-[#F8FAFC] font-['Pretendard'] w-full"
            style={{ fontFamily: '"Pretendard", sans-serif' }}
        >
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />

            {/* Top Navigation Bar */}
            <div className="px-3 pt-1.5 pb-1 flex items-center max-w-md mx-auto w-full">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                    aria-label="뒤로가기"
                >
                    <FaChevronLeft size={16} />
                </button>
                <h1 className="text-[15px] font-bold text-[#003C48] ml-1">클랜 소개</h1>
            </div>

            {/* Main Content Area */}
            <div className="max-w-md mx-auto w-full px-3.5 pb-8">

                {/* 1. Profile Section: Logo on Top + Clan Name Underneath */}
                <div className="flex flex-col items-center text-center pt-1 pb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center mb-1.5 flex-shrink-0">
                        {clan.attachFilePath ? (
                            <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                        ) : (
                            <DefaultProfile type="clan" iconSize={26} />
                        )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 break-keep leading-tight px-2">
                        {clan.name}
                    </h2>
                </div>

                {/* 2. Clan Description Box (클랜 소개가 먼저 표시되도록 순서 변경 및 기호 일치) */}
                <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] mb-1.5">
                        <FaMusic className="text-[#00BDF8] text-[11px]" />
                        <span>클랜 소개</span>
                    </div>
                    <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap break-keep">
                        {clan.description && clan.description.trim() !== '' 
                            ? clan.description
                                .replace(/🎸\s*\[장르\]/g, '🎵 [장르]')
                                .replace(/⏰\s*\[일정\]/g, '📅 [일정]')
                            : '등록된 클랜 소개글이 없습니다.'}
                    </div>
                </div>

                {/* 3. Media / Video Section (개별 영상, 채널 URL, 일반 링크 완벽 지원) */}
                {hasVideoOrUrl && (
                    isYouTubeVideo ? (
                        /* (1) 유튜브 개별 영상: 고화질 썸네일 + 재생 버튼 카드 */
                        <div
                            onClick={() => handleOpenUrl(clan.cnUrl)}
                            className="w-full relative rounded-2xl overflow-hidden aspect-video bg-black shadow-xs border border-slate-200/80 mb-3 cursor-pointer group hover:opacity-95 transition-all"
                            title="클릭하여 YouTube에서 영상 보기"
                        >
                            {/* 썸네일 이미지 */}
                            <img
                                src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
                                alt="YouTube Video Thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`;
                                }}
                            />
                            {/* 재생 버튼 오버레이 */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="w-14 h-10 bg-red-600/95 group-hover:bg-red-600 group-hover:scale-110 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200">
                                    <FaPlay size={15} className="ml-0.5 text-white" />
                                </div>
                            </div>
                            {/* 우측 하단 YouTube 보기 뱃지 */}
                            <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <FaYoutube className="text-red-500" size={13} />
                                <span>YouTube 보기</span>
                            </div>
                        </div>
                    ) : isYouTubeChannel ? (
                        /* (2) 유튜브 채널 URL (@채널, /channel/, /c/ 등): 공식 채널 전용 프리미엄 카드 */
                        <div
                            onClick={() => handleOpenUrl(clan.cnUrl)}
                            className="w-full relative rounded-2xl overflow-hidden p-3.5 bg-gradient-to-br from-[#1C1C1E] via-[#242426] to-[#121214] text-white shadow-md border border-slate-700/60 mb-3 cursor-pointer group hover:border-red-500/50 transition-all active:scale-[0.99]"
                            title="클릭하여 YouTube 채널 바로가기"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                    <FaYoutube size={26} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                            공식 채널
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">YouTube</span>
                                    </div>
                                    <h4 className="text-[13px] sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                                        {getYoutubeChannelName(clan.cnUrl)}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                        클릭하여 채널 영상 및 합주 콘텐츠 보러가기 🎵
                                    </p>
                                </div>
                                <div className="shrink-0 text-slate-400 group-hover:text-white transition-colors pl-1">
                                    <FaExternalLinkAlt size={12} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* (3) 일반 웹사이트 URL */
                        <div
                            onClick={() => handleOpenUrl(clan.cnUrl)}
                            className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-100 mb-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                            title="클릭하여 공식 자료 보기"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 text-[#00BDF8]">
                                    <FaExternalLinkAlt size={13} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 truncate">클랜 공식 자료 바로가기</div>
                                    <div className="text-[11px] text-slate-400 truncate">{clan.cnUrl}</div>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-bold shrink-0">↗</span>
                        </div>
                    )
                )}

                {/* Action Button */}
                <div className="w-full">
                    {renderActionButton()}
                </div>
            </div>
        </div>
    );
};

export default ClanIntro;
