import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

interface FeedItem {
    type: 'SHORTS' | 'POST';
    shortsNo?: number;
    postId?: number;
    title?: string;
    videoPath?: string;
    contentPreview?: string;
    thumbnailPath?: string;
    insDtime?: string;
    userId: string;
    userNickNm: string;
}

const SnsExplore: React.FC = () => {
    const navigate = useNavigate();
    const [combinedItems, setCombinedItems] = useState<FeedItem[]>([]);
    const [postsPage, setPostsPage] = useState(0);
    const [shortsPage, setShortsPage] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [hasMoreShorts, setHasMoreShorts] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: any) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                if (hasMorePosts || hasMoreShorts) {
                    if (hasMorePosts) setPostsPage(prev => prev + 1);
                    if (hasMoreShorts) setShortsPage(prev => prev + 1);
                }
            }
        }, { threshold: 0.1 });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMorePosts, hasMoreShorts]);

    const fetchAllData = async (pPage: number, sPage: number, isInitial: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const [postsRes, shortsRes] = await Promise.all([
                hasMorePosts || isInitial ? fetch(`/api/sns/posts/public?page=${pPage}&size=15`) : Promise.resolve(null),
                hasMoreShorts || isInitial ? fetch(`/api/sns/shorts/public?page=${sPage}&size=15`) : Promise.resolve(null)
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

            const merged = [...(isInitial ? [] : combinedItems), ...newPosts, ...newShorts];
            // Sort by insDtime descending
            merged.sort((a, b) => (b.insDtime || '').localeCompare(a.insDtime || ''));

            setCombinedItems(merged);
        } catch (e) {
            console.error("Failed to fetch public feed", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPostsPage(0);
        setShortsPage(0);
        setHasMorePosts(true);
        setHasMoreShorts(true);
        fetchAllData(0, 0, true);
    }, []);

    useEffect(() => {
        if (postsPage > 0 || shortsPage > 0) {
            fetchAllData(postsPage, shortsPage);
        }
    }, [postsPage, shortsPage]);

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-20 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[16px] font-bold text-[#003C48]">피드</h1>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-0.5 py-0.5 pb-20 nice-scroll">
                <div className="grid grid-cols-3 gap-1">
                    {combinedItems.map((item, index) => {
                        const isLast = index === combinedItems.length - 1;
                        const isShorts = item.type === 'SHORTS';
                        
                        return (
                            <div
                                key={isShorts ? `shorts-${item.shortsNo}` : `post-${item.postId}`}
                                ref={isLast ? lastElementRef : null}
                                className="aspect-[4/5] bg-gray-50 rounded-md overflow-hidden relative group cursor-pointer"
                                onClick={() => {
                                    // Navigate to Unified Feed passing 'public' as userId
                                    navigate(`/main/profile/feed/public`, { 
                                        state: { 
                                            initialShortsNo: isShorts ? item.shortsNo : undefined,
                                            initialPostId: !isShorts ? item.postId : undefined
                                        } 
                                    });
                                }}
                            >
                                {isShorts ? (
                                    <>
                                        {item.videoPath ? (
                                            <video 
                                                src={`${item.videoPath}#t=0.1`} 
                                                className="w-full h-full object-cover" 
                                                muted 
                                                playsInline 
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                <span className="text-[20px]">🎬</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {item.thumbnailPath ? (
                                            <img src={item.thumbnailPath} alt="post" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-100">
                                                <span className="text-[10px] text-gray-500 line-clamp-3">{item.contentPreview}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
                {isLoading && (
                    <div className="py-4 text-center text-sm text-gray-400">
                        로딩 중...
                    </div>
                )}
            </div>
        </div>
    );
};

export default SnsExplore;
