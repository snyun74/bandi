import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface FeedItem {
    type: 'SHORTS' | 'POST';
    // Shorts fields
    shortsNo?: number;
    title?: string;
    videoPath?: string;
    // Post fields
    postId?: number;
    contentPreview?: string;
    imagePaths?: string[];
    // Common fields
    userId: string;
    userNickNm: string;
    insDtime: string;
    publicTypeCd: string;
}

const SnsUnifiedFeed: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { initialPostId?: number; initialShortsNo?: number };

    const [feedList, setFeedList] = useState<FeedItem[]>([]);
    const [postsPage, setPostsPage] = useState(0);
    const [shortsPage, setShortsPage] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [hasMoreShorts, setHasMoreShorts] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchCombined = async (pPage: number, sPage: number, isInitial: boolean = false) => {
        if (!userId || isLoading) return;
        setIsLoading(true);

        try {
            const [postsRes, shortsRes] = await Promise.all([
                hasMorePosts || isInitial ? fetch(`/api/sns/posts/user/${userId}?page=${pPage}&size=15`) : Promise.resolve(null),
                hasMoreShorts || isInitial ? fetch(`/api/sns/shorts/user/${userId}?page=${sPage}&size=15`) : Promise.resolve(null)
            ]);

            let newPosts: FeedItem[] = [];
            let newShorts: FeedItem[] = [];

            if (postsRes && postsRes.ok) {
                const data = await postsRes.json();
                newPosts = data.content.map((p: any) => ({ ...p, type: 'POST' }));
                setHasMorePosts(!data.last);
            }
            if (shortsRes && shortsRes.ok) {
                const data = await shortsRes.json();
                newShorts = data.content.map((s: any) => ({ ...s, type: 'SHORTS' }));
                setHasMoreShorts(!data.last);
            }

            const merged = [...(isInitial ? [] : feedList), ...newPosts, ...newShorts];
            merged.sort((a, b) => (b.insDtime || '').localeCompare(a.insDtime || ''));

            setFeedList(merged);
        } catch (e) {
            console.error("통합 피드 로드 실패", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            setPostsPage(0);
            setShortsPage(0);
            setHasMorePosts(true);
            setHasMoreShorts(true);
            fetchCombined(0, 0, true);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && (postsPage > 0 || shortsPage > 0)) {
            fetchCombined(postsPage, shortsPage);
        }
    }, [postsPage, shortsPage]);

    // 초기 위치로 이동
    useEffect(() => {
        if (feedList.length > 0 && containerRef.current) {
            let initialIndex = -1;
            if (state?.initialPostId) {
                initialIndex = feedList.findIndex(item => item.type === 'POST' && item.postId === state.initialPostId);
            } else if (state?.initialShortsNo) {
                initialIndex = feedList.findIndex(item => item.type === 'SHORTS' && item.shortsNo === state.initialShortsNo);
            }

            if (initialIndex !== -1) {
                const targetElement = containerRef.current.children[initialIndex] as HTMLElement;
                if (targetElement) {
                    targetElement.scrollIntoView();
                }
            }
        }
    }, [feedList, state?.initialPostId, state?.initialShortsNo]);

    const handleScroll = () => {
        if (!containerRef.current || isLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            if (hasMorePosts || hasMoreShorts) {
                if (hasMorePosts) setPostsPage(prev => prev + 1);
                if (hasMoreShorts) setShortsPage(prev => prev + 1);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col h-full font-['Pretendard']">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center px-4 py-6 bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-white text-[16px] font-bold ml-2">피드</h1>
            </div>

            {/* Feed List Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {feedList.map((item) => (
                    item.type === 'SHORTS' ? (
                        <ShortsVideoItem key={`shorts-${item.shortsNo}`} item={item} />
                    ) : (
                        <PostFeedItem key={`post-${item.postId}`} post={item} />
                    )
                ))}
                
                {isLoading && (
                    <div className="h-screen flex items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- 서브 컴포넌트: 쇼츠 아이템 --- */
const ShortsVideoItem: React.FC<{ item: FeedItem }> = ({ item }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

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
            videoRef.current.play().catch(() => {
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play();
                }
            });
        } else {
            videoRef.current.pause();
        }
    }, [isIntersecting]);

    return (
        <div className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black overflow-hidden">
            <video
                ref={videoRef}
                src={item.videoPath}
                className="w-full h-full object-cover bg-black"
                loop
                playsInline
                onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play();
                    else v.pause();
                }}
            />
            {/* Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none pb-12 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-500 border border-white/40 flex items-center justify-center text-[12px] font-bold shadow-xl">
                        {(item.userNickNm || item.userId).substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-[15px] drop-shadow-md">@{item.userNickNm || item.userId}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 uppercase tracking-tighter">🎬 Shorts</span>
                </div>
                <div className="w-full max-w-[85%]">
                    <h3 className="text-[16px] leading-[1.4] line-clamp-3 font-medium drop-shadow-md">{item.title}</h3>
                </div>
            </div>
        </div>
    );
};

/* --- 서브 컴포넌트: 게시물 아이템 --- */
const PostFeedItem: React.FC<{ post: FeedItem }> = ({ post }) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleXScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollLeft, clientWidth } = e.currentTarget;
        const index = Math.round(scrollLeft / clientWidth);
        setCurrentImgIndex(index);
    };

    return (
        <div className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black overflow-hidden">
            <div 
                ref={scrollRef}
                onScroll={handleXScroll}
                className="relative w-full aspect-[4/5] bg-black flex overflow-x-scroll snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {post.imagePaths?.map((path, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                        <img src={path} alt={`post-${idx}`} className="w-full h-full object-cover" />
                    </div>
                ))}
                
                {post.imagePaths && post.imagePaths.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {post.imagePaths.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentImgIndex ? 'bg-white scale-110' : 'bg-white/30'}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none pb-12 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-500 border border-white/40 flex items-center justify-center text-[12px] font-bold shadow-xl">
                        {(post.userNickNm || post.userId).substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-[15px] drop-shadow-md">@{post.userNickNm || post.userId}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 uppercase tracking-tighter">📸 Post</span>
                </div>
                <div className="w-full max-w-[85%]">
                    <p className="text-[15px] leading-[1.5] line-clamp-3 drop-shadow-md">{post.contentPreview}</p>
                </div>
            </div>
        </div>
    );
};

export default SnsUnifiedFeed;
