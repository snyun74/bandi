import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

interface ShortsItem {
    shortsNo: number;
    userId: string;
    userNickNm: string;
    title: string;
    videoPath: string;
    publicTypeCd: string;
    insDtime: string;
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

    const fetchShorts = async (pageNum: number) => {
        if (!userId || isLoading) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/sns/shorts/user/${userId}?page=${pageNum}&size=30`);
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

    // 초기 위치로 이동
    useEffect(() => {
        if (shortsList.length > 0 && state?.initialShortsNo && containerRef.current) {
            const initialIndex = shortsList.findIndex(s => s.shortsNo === state.initialShortsNo);
            if (initialIndex !== -1) {
                const targetElement = containerRef.current.children[initialIndex] as HTMLElement;
                if (targetElement) {
                    targetElement.scrollIntoView();
                }
            }
        }
    }, [shortsList, state?.initialShortsNo]);

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
                    <ShortsVideoItem key={item.shortsNo} item={item} />
                ))}
                
                {isLoading && (
                    <div className="h-screen flex items-center justify-center text-white pb-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ShortsVideoItem: React.FC<{ item: ShortsItem }> = ({ item }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { threshold: 0.7 } // 70% 이상 보일 때 재생
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isIntersecting) {
            // 소리 포함 재생 시도 (사용자 제스처 이후이므로 가능할 확률 높음)
            videoRef.current.play().catch(err => {
                console.log("자동 재생 차단됨 (음소거로 시도)", err);
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
                className="w-full h-full object-contain"
                loop
                playsInline
                onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play();
                    else v.pause();
                }}
            />

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none pb-12">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gray-500 border border-white/40 flex items-center justify-center text-white text-[12px] font-bold shadow-lg">
                        {(item.userNickNm || item.userId).substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">@{item.userNickNm || item.userId}</span>
                </div>
                <div className="w-full max-w-[85%]">
                    <h3 className="text-white text-[16px] leading-[1.4] break-all overflow-hidden line-clamp-3 drop-shadow-md font-medium">
                        {item.title}
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default SnsShortsFeed;
