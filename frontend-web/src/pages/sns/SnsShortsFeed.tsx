import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import { Heart, MessageSquareText, Eye } from 'lucide-react';
import SnsCommentModal from '../../components/sns/SnsCommentModal';
import UserAvatar from '../../components/common/UserAvatar';

interface ShortsItem {
    shortsNo: number;
    userId: string;
    userNickNm: string;
    userProfileImagePath?: string | null;
    title: string;
    videoPath: string;
    publicTypeCd: string;
    overlayData?: string;
    insDtime: string;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    userAction?: 'L' | 'D' | null;
    commentCount?: number;
}

const SnsShortsFeed: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { initialShortsNo?: number };
    
    const [shortsList, setShortsList] = useState<ShortsItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentUserId = localStorage.getItem('userId');

    // Comment Modal State
    const [commentModalState, setCommentModalState] = useState<{
        isOpen: boolean;
        targetId: number;
    }>({
        isOpen: false,
        targetId: 0
    });

    const fetchShorts = async (pageNum: number) => {
        if (!userId || isLoading) return;
        setIsLoading(true);
        const userQuery = currentUserId ? `&currentUserId=${currentUserId}` : '';
        try {
            const res = await fetch(`/api/sns/shorts/user/${userId}?page=${pageNum}&size=30${userQuery}`);
            if (res.ok) {
                const data = await res.json();
                setShortsList(prev => pageNum === 0 ? data.content : [...prev, ...data.content]);
                setHasMore(!data.last);
            }
        } catch (e) {
            console.error("쇼츠 피드 로드 실패", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShorts(0);
    }, [userId]);

    useEffect(() => {
        if (page > 0) {
            fetchShorts(page);
        }
    }, [page]);

    const hasScrolledToInitial = useRef(false);

    // 초기 위치로 이동 (최초 1회만 수행)
    useEffect(() => {
        if (!hasScrolledToInitial.current && shortsList.length > 0 && state?.initialShortsNo && containerRef.current) {
            const initialIndex = shortsList.findIndex(s => s.shortsNo === state.initialShortsNo);
            if (initialIndex !== -1) {
                const targetElement = containerRef.current.children[initialIndex] as HTMLElement;
                if (targetElement) {
                    targetElement.scrollIntoView();
                }
            }
            hasScrolledToInitial.current = true;
        }
    }, [shortsList, state?.initialShortsNo]);

    const handleScroll = () => {
        if (!containerRef.current || !hasMore || isLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            setPage(prev => prev + 1);
        }
    };

    const handleLikeToggle = async (shortsNo: number, actionType: 'L' | 'D') => {
        if (!currentUserId) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const url = `/api/sns/shorts/${shortsNo}/like?userId=${currentUserId}&actionTypeFg=${actionType}`;
            const res = await fetch(url, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setShortsList(prev => prev.map(item => {
                    if (item.shortsNo === shortsNo) {
                        return { ...item, likeCount: data.likeCount, dislikeCount: data.dislikeCount, userAction: data.userAction };
                    }
                    return item;
                }));
            }
        } catch (err) {
            console.error("Shorts like toggle failed:", err);
        }
    };

    const handleViewRecorded = (shortsNo: number, newTotalViews: number) => {
        setShortsList(prev => prev.map(item => {
            if (item.shortsNo === shortsNo) {
                return { ...item, viewCount: newTotalViews };
            }
            return item;
        }));
    };

    const handleCommentCountUpdate = (newCount: number) => {
        setShortsList(prev => prev.map(item => {
            if (item.shortsNo === commentModalState.targetId) {
                return { ...item, commentCount: newCount };
            }
            return item;
        }));
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col h-full font-['Pretendard']">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center px-4 py-6 bg-gradient-to-b from-black/70 to-transparent">
                <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-white text-[16px] font-bold ml-2">쇼츠</h1>
            </div>

            {/* Shorts List Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {shortsList.map((item) => (
                    <div key={item.shortsNo} className="relative h-screen w-full snap-start overflow-hidden">
                        <ShortsVideoItem 
                            item={item} 
                            onViewRecord={(count) => handleViewRecorded(item.shortsNo, count)}
                        />

                        {/* Right Action Bar (SNS & YouTube Shorts Minimal Outline Style) */}
                        <div className="absolute right-3.5 bottom-24 z-40 flex flex-col items-center gap-4 text-white select-none">
                            {/* Heart (Like) Button */}
                            <button
                                onClick={() => handleLikeToggle(item.shortsNo, 'L')}
                                className="flex flex-col items-center group active:scale-90 transition-transform cursor-pointer"
                            >
                                <Heart 
                                    size={24} 
                                    strokeWidth={1.8}
                                    className={item.userAction === 'L' 
                                        ? 'text-white fill-white scale-105 transition-all' 
                                        : 'text-white/90 group-hover:text-white transition-colors'} 
                                />
                                <span className="text-[12px] font-medium mt-1 text-white/90">
                                    {item.likeCount || 0}
                                </span>
                            </button>

                            {/* Comment Button */}
                            <button
                                onClick={() => setCommentModalState({
                                    isOpen: true,
                                    targetId: item.shortsNo
                                })}
                                className="flex flex-col items-center group active:scale-90 transition-transform cursor-pointer"
                            >
                                <MessageSquareText 
                                    size={24} 
                                    strokeWidth={1.8}
                                    className="text-white/90 group-hover:text-white transition-colors" 
                                />
                                <span className="text-[12px] font-medium mt-1 text-white/90">
                                    {item.commentCount || 0}
                                </span>
                            </button>

                            {/* View Count Indicator */}
                            <div className="flex flex-col items-center">
                                <Eye 
                                    size={22} 
                                    strokeWidth={1.8}
                                    className="text-white/75" 
                                />
                                <span className="text-[11px] font-medium mt-1 text-white/75">
                                    {item.viewCount || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="h-screen flex items-center justify-center text-white pb-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            {/* Comment Modal */}
            <SnsCommentModal
                isOpen={commentModalState.isOpen}
                onClose={() => setCommentModalState(prev => ({ ...prev, isOpen: false }))}
                type="SHORTS"
                targetId={commentModalState.targetId}
                onCommentCountChange={handleCommentCountUpdate}
            />
        </div>
    );
};

const ShortsVideoItem: React.FC<{
    item: ShortsItem;
    onViewRecord: (newCount: number) => void;
}> = ({ item, onViewRecord }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const hasViewBeenRecorded = useRef(false);
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { threshold: 0.7 }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isIntersecting) {
            videoRef.current.play().catch(err => {
                console.log("자동 재생 차단됨 (음소거로 시도)", err);
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play();
                }
            });

            if (!hasViewBeenRecorded.current && item.shortsNo) {
                hasViewBeenRecorded.current = true;
                fetch(`/api/sns/shorts/${item.shortsNo}/view?userId=${currentUserId || ''}`, { method: 'POST' })
                    .then(res => res.json())
                    .then(totalViews => onViewRecord(totalViews))
                    .catch(err => console.error("View record failed:", err));
            }
        } else {
            videoRef.current.pause();
        }
    }, [isIntersecting, item.shortsNo, currentUserId, onViewRecord]);

    let overlayInfo: any = null;
    if (item.overlayData) {
        try {
            overlayInfo = JSON.parse(item.overlayData);
        } catch (e) {}
    }

    const filterCss = overlayInfo?.filter ? (
        overlayInfo.filter === 'blur' ? 'blur(3px)' :
        overlayInfo.filter === 'bright' ? 'brightness(1.25)' :
        overlayInfo.filter === 'dark' ? 'brightness(0.75)' :
        overlayInfo.filter === 'grayscale' ? 'grayscale(1)' :
        overlayInfo.filter === 'sepia' ? 'sepia(0.8)' :
        overlayInfo.filter === 'warm' ? 'sepia(0.3) brightness(1.05) saturate(1.2)' :
        overlayInfo.filter === 'cool' ? 'hue-rotate(30deg) brightness(1.05) saturate(0.9)' : 'none'
    ) : 'none';

    const handleVideoTimeUpdate = () => {
        if (videoRef.current && overlayInfo?.startTime !== undefined && overlayInfo?.endTime) {
            const start = overlayInfo.startTime;
            const end = overlayInfo.endTime;
            if (videoRef.current.currentTime < start || videoRef.current.currentTime >= end) {
                videoRef.current.currentTime = start;
            }
        }
    };

    return (
        <div className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black overflow-hidden">
            <video
                ref={videoRef}
                src={item.videoPath}
                className="w-full h-full object-contain bg-black"
                style={{ filter: filterCss }}
                loop
                playsInline
                {...({ 'webkit-playsinline': 'true' } as any)}
                onTimeUpdate={handleVideoTimeUpdate}
                onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play();
                    else v.pause();
                }}
            />

            {/* 자막 메타데이터 라이브 오버레이 */}
            {overlayInfo?.textOverlay?.text && (
                <div 
                    className="absolute flex justify-center pointer-events-none z-10"
                    style={{
                        top: `${overlayInfo.textOverlay.posY || 50}%`,
                        left: `${overlayInfo.textOverlay.posX || 50}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <span 
                        className="px-3.5 py-2 rounded-xl font-bold shadow-xl text-center max-w-[90vw] break-words drop-shadow-md"
                        style={{
                            color: overlayInfo.textOverlay.color || '#ffffff',
                            backgroundColor: overlayInfo.textOverlay.bgColor || 'rgba(0,0,0,0.5)',
                            fontSize: `${overlayInfo.textOverlay.fontSize || 22}px`
                        }}
                    >
                        {overlayInfo.textOverlay.text}
                    </span>
                </div>
            )}

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-0 left-0 right-16 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none pb-12">
                <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                        profileImagePath={item.userProfileImagePath}
                        nickName={item.userNickNm}
                        userId={item.userId}
                        size={36}
                        className="border-white/40"
                    />
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">@{item.userNickNm || item.userId}</span>
                </div>
                <div className="w-full">
                    <h3 className="text-white text-[15px] leading-[1.4] break-all overflow-hidden line-clamp-3 drop-shadow-md font-medium">
                        {item.title}
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default SnsShortsFeed;
