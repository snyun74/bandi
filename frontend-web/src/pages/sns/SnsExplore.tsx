import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlay } from 'react-icons/fa';

interface FeedItem {
    type: 'SHORTS' | 'POST';
    shortsNo?: number;
    postId?: number;
    title?: string;
    videoPath?: string;
    overlayData?: string;
    contentPreview?: string;
    thumbnailPath?: string;
    editDataList?: string[];
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
        <div
            className="flex flex-col bg-white font-['Pretendard']"
            style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + var(--safe-top))',
                bottom: 'calc(var(--nav-offset) + var(--safe-bottom))',
                left: 0,
                right: 0,
                fontFamily: '"Pretendard", sans-serif'
            }}
        >
            {/* Header (고정) */}
            <div className="flex items-center justify-between px-4 py-3 bg-white z-30 border-b border-gray-50 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[16px] font-bold text-[#003C48]">피드</h1>
                </div>
            </div>

            {/* Grid Content (독립 스크롤) */}
            <div className="flex-1 overflow-y-auto min-h-0 px-0.5 py-0.5 pb-16 nice-scroll">
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
                                    navigate(`/main/profile/feed/public`, { 
                                        state: { 
                                            initialShortsNo: isShorts ? item.shortsNo : undefined,
                                            initialPostId: !isShorts ? item.postId : undefined
                                        } 
                                    });
                                }}
                            >
                                {isShorts ? (() => {
                                    let overlayInfo: any = null;
                                    try { if (item.overlayData) overlayInfo = JSON.parse(item.overlayData); } catch(e) {}
                                    const filterCss = overlayInfo?.filter && overlayInfo.filter !== 'none' ? (
                                        overlayInfo.filter === 'blur' ? 'blur(3px)' :
                                        overlayInfo.filter === 'bright' ? 'brightness(1.25)' :
                                        overlayInfo.filter === 'dark' ? 'brightness(0.75)' :
                                        overlayInfo.filter === 'grayscale' ? 'grayscale(1)' :
                                        overlayInfo.filter === 'sepia' ? 'sepia(0.8)' :
                                        overlayInfo.filter === 'warm' ? 'sepia(0.3) brightness(1.05) saturate(1.2)' :
                                        overlayInfo.filter === 'cool' ? 'hue-rotate(30deg) brightness(1.05) saturate(0.9)' : 'none'
                                    ) : 'none';
                                    return (
                                        <>
                                            {item.videoPath ? (
                                                <video 
                                                    src={`${item.videoPath}#t=0.1`} 
                                                    className="w-full h-full object-cover" 
                                                    style={{ filter: filterCss }}
                                                    muted 
                                                    playsInline 
                                                    {...({ 'webkit-playsinline': 'true' } as any)}
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                    <span className="text-[20px]">🎬</span>
                                                </div>
                                            )}
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
                                                        className="px-1 py-0.5 rounded text-center max-w-full break-words font-bold"
                                                        style={{
                                                            color: overlayInfo.textOverlay.color || '#ffffff',
                                                            backgroundColor: overlayInfo.textOverlay.bgColor || 'rgba(0,0,0,0.5)',
                                                            fontSize: `${Math.max(8, Math.round((overlayInfo.textOverlay.fontSize || 22) * 0.45))}px`
                                                        }}
                                                    >
                                                        {overlayInfo.textOverlay.text}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })() : (() => {
                                    let imgEdit: any = null;
                                    try { if (item.editDataList?.[0]) imgEdit = JSON.parse(item.editDataList[0]); } catch(e) {}
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
                                    const isVideoThumb = item.thumbnailPath ? /\.(mp4|mov|webm|ogg|m4v|avi|mkv)(\?.*)?$/i.test(item.thumbnailPath) : false;

                                    return (
                                        <>
                                            {item.thumbnailPath ? (
                                                isVideoThumb ? (
                                                    <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
                                                        <video
                                                            src={`${item.thumbnailPath}#t=0.1`}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                        />
                                                        <div className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-md text-[9px] flex items-center gap-1 backdrop-blur-xs pointer-events-none">
                                                            <FaPlay size={8} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="w-full h-full"
                                                        style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                                                    >
                                                        <img src={item.thumbnailPath} alt="post" className="w-full h-full object-cover" style={{ filter: filterCss }} />
                                                    </div>
                                                )
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-100">
                                                    <span className="text-[10px] text-gray-500 line-clamp-3">{item.contentPreview}</span>
                                                </div>
                                            )}
                                            {imgEdit?.textOverlay?.text && !isVideoThumb && (
                                                <div 
                                                    className="absolute flex justify-center pointer-events-none z-10"
                                                    style={{
                                                        top: `${imgEdit.textOverlay.posY || 50}%`,
                                                        left: `${imgEdit.textOverlay.posX || 50}%`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                >
                                                    <span 
                                                        className="px-1 py-0.5 rounded text-center max-w-full break-words font-bold"
                                                        style={{
                                                            color: imgEdit.textOverlay.color || '#ffffff',
                                                            backgroundColor: imgEdit.textOverlay.bgColor || 'rgba(0,0,0,0.5)',
                                                            fontSize: `${Math.max(8, Math.round((imgEdit.textOverlay.fontSize || 22) * 0.45))}px`
                                                        }}
                                                    >
                                                        {imgEdit.textOverlay.text}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
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
