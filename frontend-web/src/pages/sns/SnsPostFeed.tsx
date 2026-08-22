import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PostItem {
    postId: number;
    userId: string;
    userNickNm: string;
    contentPreview: string;
    imagePaths: string[];
    editDataList?: string[];
    publicTypeCd: string;
    insDtime: string;
}

const SnsPostFeed: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { initialPostId?: number };

    const [postList, setPostList] = useState<PostItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchPosts = async (pageNum: number) => {
        if (!userId || isLoading) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sns/posts/user/${userId}?page=${pageNum}&size=30`);
            if (res.ok) {
                const data = await res.json();
                setPostList(prev => pageNum === 0 ? data.content : [...prev, ...data.content]);
                setHasMore(!data.last);
            }
        } catch (e) {
            console.error("게시물 피드 로드 실패", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(0);
    }, [userId]);

    useEffect(() => {
        if (page > 0) {
            fetchPosts(page);
        }
    }, [page]);

    // 초기 위치로 이동
    useEffect(() => {
        if (postList.length > 0 && state?.initialPostId && containerRef.current) {
            const initialIndex = postList.findIndex(p => p.postId === state.initialPostId);
            if (initialIndex !== -1) {
                const targetElement = containerRef.current.children[initialIndex] as HTMLElement;
                if (targetElement) {
                    targetElement.scrollIntoView();
                }
            }
        }
    }, [postList, state?.initialPostId]);

    const handleScroll = () => {
        if (!containerRef.current || !hasMore || isLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
            setPage(prev => prev + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col h-full font-['Pretendard']">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center px-4 py-6 bg-gradient-to-b from-black/60 to-transparent">
                <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-white text-[16px] font-bold ml-2">게시물</h1>
            </div>

            {/* Posts Page Container (Vertical Scroll) */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {postList.map((post) => (
                    <PostFeedItem key={post.postId} post={post} />
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

const PostFeedItem: React.FC<{ post: PostItem }> = ({ post }) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { threshold: 0.6 }
        );

        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, []);

    // 화면 진입 및 슬라이드 변경 시 동영상 자동 재생/일시정지 제어
    useEffect(() => {
        post.imagePaths?.forEach((path, idx) => {
            const video = videoRefs.current[idx];
            if (!video) return;

            const isCurrent = isIntersecting && idx === currentImgIndex;
            if (isCurrent) {
                video.currentTime = 0;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        video.muted = true;
                        video.play().catch(() => {});
                    });
                }
            } else {
                video.pause();
            }
        });
    }, [isIntersecting, currentImgIndex, post.imagePaths]);

    const handleXScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollLeft, clientWidth } = e.currentTarget;
        const index = Math.round(scrollLeft / clientWidth);
        setCurrentImgIndex(index);
    };

    return (
        <div ref={itemRef} className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black overflow-hidden">
            {/* Horizontal Scroll Area (Images) */}
            <div 
                ref={scrollRef}
                onScroll={handleXScroll}
                className="relative w-full aspect-[4/5] bg-black flex overflow-x-scroll snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {post.imagePaths.map((path, idx) => {
                    let imgEdit: any = null;
                    if (post.editDataList && post.editDataList[idx]) {
                        try {
                            imgEdit = JSON.parse(post.editDataList[idx]);
                        } catch (e) {}
                    }
                    const filterCss = imgEdit?.filter && imgEdit.filter !== 'none' ? (
                        imgEdit.filter === 'blur' ? 'blur(3px)' :
                        imgEdit.filter === 'bright' ? 'brightness(1.25)' :
                        imgEdit.filter === 'dark' ? 'brightness(0.75)' :
                        imgEdit.filter === 'grayscale' ? 'grayscale(1)' :
                        imgEdit.filter === 'sepia' ? 'sepia(0.8)' :
                        imgEdit.filter === 'warm' ? 'sepia(0.3) brightness(1.05) saturate(1.2)' :
                        imgEdit.filter === 'cool' ? 'hue-rotate(30deg) brightness(1.05) saturate(0.9)' : 'none'
                    ) : 'none';
                    const rotation = imgEdit?.rotation || 0;
                    const flipH = imgEdit?.flipH || false;

                    const isVideo = path ? /\.(mp4|mov|webm|ogg|m4v|avi|mkv)(\?.*)?$/i.test(path) : false;

                    return (
                        <div key={idx} className="w-full h-full flex-shrink-0 snap-center snap-always flex items-center justify-center relative overflow-hidden bg-black">
                            {isVideo ? (
                                <video
                                    ref={(el) => { videoRefs.current[idx] = el; }}
                                    src={path}
                                    controls
                                    playsInline
                                    loop
                                    {...({ 'webkit-playsinline': 'true' } as any)}
                                    className="w-full h-full object-contain bg-black cursor-pointer"
                                    onClick={(e) => {
                                        const v = e.currentTarget;
                                        if (v.paused) v.play();
                                        else v.pause();
                                    }}
                                />
                            ) : (
                                <>
                                    <div 
                                        className="w-full h-full flex items-center justify-center transition-transform duration-200"
                                        style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                                    >
                                        <img 
                                            src={path} 
                                            alt={`post-${idx}`} 
                                            className="w-full h-full object-contain" 
                                            style={{ 
                                                filter: filterCss,
                                                imageRendering: 'auto',
                                                WebkitBackfaceVisibility: 'hidden',
                                                backfaceVisibility: 'hidden',
                                                transform: 'translateZ(0)' // GPU 가속 유도
                                            }}
                                        />
                                    </div>
                                    {imgEdit?.textOverlay?.text && (
                                        <div 
                                            className="absolute flex justify-center pointer-events-none z-10"
                                            style={{
                                                top: `${imgEdit.textOverlay.posY || 50}%`,
                                                left: `${imgEdit.textOverlay.posX || 50}%`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <span 
                                                className="px-3.5 py-2 rounded-xl font-bold shadow-xl text-center max-w-[90vw] break-words drop-shadow-md"
                                                style={{
                                                    color: imgEdit.textOverlay.color || '#ffffff',
                                                    backgroundColor: imgEdit.textOverlay.bgColor || 'rgba(0,0,0,0.5)',
                                                    fontSize: `${imgEdit.textOverlay.fontSize || 22}px`
                                                }}
                                            >
                                                {imgEdit.textOverlay.text}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Left/Right Navigation Indicators (Optional visual hint) */}
                {post.imagePaths.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {post.imagePaths.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImgIndex ? 'bg-white scale-110' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                )}
                
                {/* Arrow Hints (Only show if multiple images) */}
                {post.imagePaths.length > 1 && currentImgIndex < post.imagePaths.length - 1 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 animate-pulse">
                        <FaChevronRight size={24} />
                    </div>
                )}
            </div>

            {/* Bottom Overlay Info (Nickname, Content) */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none pb-12">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-500 border border-white/40 flex items-center justify-center text-white text-[12px] font-bold shadow-lg">
                        {(post.userNickNm || post.userId).substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">@{post.userNickNm || post.userId}</span>
                </div>
                <div className="w-full max-w-[85%]">
                    <p className="text-white text-[15px] leading-[1.5] break-all overflow-hidden line-clamp-3 drop-shadow-md">
                        {post.contentPreview}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SnsPostFeed;
