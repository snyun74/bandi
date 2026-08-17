import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaThumbsUp, FaThumbsDown, FaComment, FaEye } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import CommonModal from '../../components/common/CommonModal';
import SnsCommentModal from '../../components/sns/SnsCommentModal';
import UserAvatar from '../../components/common/UserAvatar';

interface FeedItem {
    type: 'SHORTS' | 'POST';
    // Shorts fields
    shortsNo?: number;
    title?: string;
    videoPath?: string;
    overlayData?: string;
    // Post fields
    postId?: number;
    contentPreview?: string;
    imagePaths?: string[];
    editDataList?: string[];
    // Common fields
    userId: string;
    userNickNm: string;
    userProfileImagePath?: string | null;
    insDtime: string;
    publicTypeCd: string;
    // Stats & Action fields
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    userAction?: 'L' | 'D' | null;
    commentCount?: number;
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

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isPublicTypeModalOpen, setIsPublicTypeModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'POST' | 'SHORTS', id: number | string } | null>(null);
    const [publicTypes, setPublicTypes] = useState<{ commDtlCd: string; commDtlNm: string }[]>([]);
    const currentUserId = localStorage.getItem('userId');

    // Comment Modal State
    const [commentModalState, setCommentModalState] = useState<{
        isOpen: boolean;
        type: 'POST' | 'SHORTS';
        targetId: number;
    }>({
        isOpen: false,
        type: 'POST',
        targetId: 0
    });

    useEffect(() => {
        const fetchCommonCodes = async () => {
            try {
                const res = await fetch('/api/auth/common/codes/BD007');
                if (res.ok) {
                    const data = await res.json();
                    setPublicTypes(data.filter((pt: any) => pt.commDtlNm !== '친구'));
                }
            } catch (err) {
                console.error("공통코드 BD007 조회 실패", err);
            }
        };
        fetchCommonCodes();
    }, []);

    const fetchCombined = async (pPage: number, sPage: number, isInitial: boolean = false) => {
        if (!userId || isLoading) return;
        setIsLoading(true);

        const userQuery = currentUserId ? `&currentUserId=${currentUserId}` : '';

        try {
            const [postsRes, shortsRes] = await Promise.all([
                hasMorePosts || isInitial 
                    ? fetch(userId === 'public' 
                        ? `/api/sns/posts/public?page=${pPage}&size=15${userQuery}` 
                        : `/api/sns/posts/user/${userId}?page=${pPage}&size=15${userQuery}`) 
                    : Promise.resolve(null),
                hasMoreShorts || isInitial 
                    ? fetch(userId === 'public' 
                        ? `/api/sns/shorts/public?page=${sPage}&size=15${userQuery}` 
                        : `/api/sns/shorts/user/${userId}?page=${sPage}&size=15${userQuery}`) 
                    : Promise.resolve(null)
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

    const hasScrolledToInitial = useRef(false);

    // 초기 위치로 이동 (최초 1회만 수행)
    useEffect(() => {
        if (!hasScrolledToInitial.current && feedList.length > 0 && containerRef.current) {
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
            hasScrolledToInitial.current = true;
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

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !currentUserId) return;

        try {
            const url = itemToDelete.type === 'POST' 
                ? `/api/sns/posts/${itemToDelete.id}?userId=${currentUserId}`
                : `/api/sns/shorts/${itemToDelete.id}?userId=${currentUserId}`;
            
            const response = await fetch(url, { method: 'DELETE' });
            
            if (response.ok) {
                setFeedList(prev => prev.filter(item => {
                    if (itemToDelete.type === 'POST') {
                        return !(item.type === 'POST' && item.postId === itemToDelete.id);
                    } else {
                        return !(item.type === 'SHORTS' && item.shortsNo === itemToDelete.id);
                    }
                }));
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handlePublicTypeChange = async (typeCd: string) => {
        if (!itemToDelete || !currentUserId) return;
        try {
            const url = itemToDelete.type === 'POST' 
                ? `/api/sns/posts/${itemToDelete.id}/public-type?userId=${currentUserId}&publicTypeCd=${typeCd}`
                : `/api/sns/shorts/${itemToDelete.id}/public-type?userId=${currentUserId}&publicTypeCd=${typeCd}`;
            
            const response = await fetch(url, { method: 'PATCH' });
            if (response.ok) {
                setFeedList(prev => prev.map(item => {
                    if (item.type === itemToDelete.type && (item.postId === itemToDelete.id || item.shortsNo === itemToDelete.id)) {
                        return { ...item, publicTypeCd: typeCd };
                    }
                    return item;
                }));
            }
        } catch (error) {
            console.error("Update public type error:", error);
        } finally {
            setIsPublicTypeModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleLikeToggle = async (type: 'POST' | 'SHORTS', id: number, actionType: 'L' | 'D') => {
        if (!currentUserId) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const url = type === 'POST'
                ? `/api/sns/posts/${id}/like?userId=${currentUserId}&actionTypeFg=${actionType}`
                : `/api/sns/shorts/${id}/like?userId=${currentUserId}&actionTypeFg=${actionType}`;

            const res = await fetch(url, { method: 'POST' });
            if (res.ok) {
                const data = await res.json(); // { likeCount, dislikeCount, userAction }
                setFeedList(prev => prev.map(item => {
                    if (type === 'POST' && item.type === 'POST' && item.postId === id) {
                        return { ...item, likeCount: data.likeCount, dislikeCount: data.dislikeCount, userAction: data.userAction };
                    }
                    if (type === 'SHORTS' && item.type === 'SHORTS' && item.shortsNo === id) {
                        return { ...item, likeCount: data.likeCount, dislikeCount: data.dislikeCount, userAction: data.userAction };
                    }
                    return item;
                }));
            }
        } catch (err) {
            console.error("Like toggle failed:", err);
        }
    };

    const handleViewRecorded = (type: 'POST' | 'SHORTS', id: number, newTotalViews: number) => {
        setFeedList(prev => prev.map(item => {
            if (type === 'POST' && item.type === 'POST' && item.postId === id) {
                return { ...item, viewCount: newTotalViews };
            }
            if (type === 'SHORTS' && item.type === 'SHORTS' && item.shortsNo === id) {
                return { ...item, viewCount: newTotalViews };
            }
            return item;
        }));
    };

    const handleCommentCountUpdate = (newCount: number) => {
        const { type, targetId } = commentModalState;
        setFeedList(prev => prev.map(item => {
            if (type === 'POST' && item.type === 'POST' && item.postId === targetId) {
                return { ...item, commentCount: newCount };
            }
            if (type === 'SHORTS' && item.type === 'SHORTS' && item.shortsNo === targetId) {
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
                <h1 className="text-white text-[16px] font-bold ml-2">피드</h1>
            </div>

            {/* Feed List Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none h-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {feedList.map((item) => {
                    const isMyContent = item.userId === currentUserId && userId !== 'public';
                    const itemKey = item.type === 'SHORTS' ? `shorts-${item.shortsNo}` : `post-${item.postId}`;
                    const targetId = item.type === 'SHORTS' ? item.shortsNo! : item.postId!;
                    
                    return (
                        <div key={itemKey} className="relative h-screen w-full snap-start overflow-hidden">
                            {item.type === 'SHORTS' ? (
                                <ShortsVideoItem 
                                    item={item} 
                                    onViewRecord={(count) => handleViewRecorded('SHORTS', item.shortsNo!, count)}
                                />
                            ) : (
                                <PostFeedItem 
                                    post={item} 
                                    onViewRecord={(count) => handleViewRecorded('POST', item.postId!, count)}
                                />
                            )}
                            
                            {/* Right Action Bar (YouTube Shorts Style) */}
                            <div className="absolute right-4 bottom-28 z-40 flex flex-col items-center gap-5 text-white">
                                {/* Thumbs Up Button */}
                                <button
                                    onClick={() => handleLikeToggle(item.type, targetId, 'L')}
                                    className="flex flex-col items-center group"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 shadow-lg ${
                                        item.userAction === 'L'
                                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/40'
                                            : 'bg-black/35 text-white border-white/20 hover:bg-black/50'
                                    }`}>
                                        <FaThumbsUp size={20} className={item.userAction === 'L' ? 'scale-110' : ''} />
                                    </div>
                                    <span className="text-[12px] font-semibold mt-1 drop-shadow-md">
                                        {item.likeCount || 0}
                                    </span>
                                </button>

                                {/* Thumbs Down Button */}
                                <button
                                    onClick={() => handleLikeToggle(item.type, targetId, 'D')}
                                    className="flex flex-col items-center group"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 shadow-lg ${
                                        item.userAction === 'D'
                                            ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/40'
                                            : 'bg-black/35 text-white border-white/20 hover:bg-black/50'
                                    }`}>
                                        <FaThumbsDown size={20} className={item.userAction === 'D' ? 'scale-110' : ''} />
                                    </div>
                                    <span className="text-[12px] font-semibold mt-1 drop-shadow-md">
                                        {item.dislikeCount || 0}
                                    </span>
                                </button>

                                {/* Comment Button */}
                                <button
                                    onClick={() => setCommentModalState({
                                        isOpen: true,
                                        type: item.type,
                                        targetId: targetId
                                    })}
                                    className="flex flex-col items-center group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-black/35 text-white border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-black/50 transition-all active:scale-90 shadow-lg">
                                        <FaComment size={20} />
                                    </div>
                                    <span className="text-[12px] font-semibold mt-1 drop-shadow-md">
                                        {item.commentCount || 0}
                                    </span>
                                </button>

                                {/* View Count Indicator */}
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-black/25 text-zinc-300 border border-white/10 flex items-center justify-center backdrop-blur-xs">
                                        <FaEye size={17} />
                                    </div>
                                    <span className="text-[11px] font-medium text-zinc-300 mt-1 drop-shadow-md">
                                        {item.viewCount || 0}
                                    </span>
                                </div>
                            </div>

                            {/* More Menu Button (Glassmorphism) */}
                            {isMyContent && (
                                <button
                                    onClick={() => {
                                        setItemToDelete({ 
                                            type: item.type, 
                                            id: targetId 
                                        });
                                        setIsActionMenuOpen(true);
                                    }}
                                    className="absolute top-6 right-4 z-[60] w-10 h-10 flex items-center justify-center bg-black/20 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg active:scale-90 transition-all"
                                >
                                    <BsThreeDotsVertical size={22} className="drop-shadow-md" />
                                </button>
                            )}
                        </div>
                    );
                })}
                
                {isLoading && (
                    <div className="h-screen flex items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            {/* Comment Modal */}
            <SnsCommentModal
                isOpen={commentModalState.isOpen}
                onClose={() => setCommentModalState(prev => ({ ...prev, isOpen: false }))}
                type={commentModalState.type}
                targetId={commentModalState.targetId}
                onCommentCountChange={handleCommentCountUpdate}
            />

            {/* Delete Confirmation Modal */}
            <CommonModal
                isOpen={isDeleteModalOpen}
                type="confirm"
                variant="danger"
                message={itemToDelete?.type === 'SHORTS' ? "쇼츠를 삭제하시겠습니까?" : "게시물을 삭제하시겠습니까?"}
                onConfirm={handleDeleteConfirm}
                onCancel={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
            />

            {/* Action Menu (Bottom Sheet) */}
            {isActionMenuOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => setIsActionMenuOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-t-[24px] pb-[calc(24px+var(--safe-bottom))] animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                        <div className="flex flex-col py-2">
                            <button
                                onClick={() => {
                                    setIsActionMenuOpen(false);
                                    setIsPublicTypeModalOpen(true);
                                }}
                                className="w-full py-4 text-gray-800 font-bold text-[16px] active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>공개여부 설정</span>
                            </button>
                            <div className="mx-4 h-[1px] bg-gray-100" />
                            <button
                                onClick={() => {
                                    setIsActionMenuOpen(false);
                                    setIsDeleteModalOpen(true);
                                }}
                                className="w-full py-4 text-[#FF3B30] font-bold text-[16px] active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>삭제</span>
                            </button>
                            <div className="mx-4 h-[1px] bg-gray-100" />
                            <button
                                onClick={() => setIsActionMenuOpen(false)}
                                className="w-full py-4 text-gray-800 font-medium text-[16px] active:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Public Type Modal (Bottom Sheet) */}
            {isPublicTypeModalOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end justify-center">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => {
                            setIsPublicTypeModalOpen(false);
                            setItemToDelete(null);
                        }}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-t-[24px] pb-[calc(20px+var(--safe-bottom))] animate-in slide-in-from-bottom duration-300 overflow-hidden shadow-2xl">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                        <div className="px-4 py-3 text-center border-b border-gray-100">
                            <h3 className="text-[16px] font-bold text-gray-800">공개여부 설정</h3>
                        </div>
                        <div className="flex flex-col py-2">
                            {publicTypes.map(pt => {
                                const currentItem = itemToDelete ? feedList.find(item => item.type === itemToDelete.type && (item.postId === itemToDelete.id || item.shortsNo === itemToDelete.id)) : null;
                                const isSelected = currentItem?.publicTypeCd === pt.commDtlCd;
                                return (
                                    <button
                                        key={pt.commDtlCd}
                                        onClick={() => handlePublicTypeChange(pt.commDtlCd)}
                                        className={`w-full py-4 text-[15px] transition-colors flex items-center justify-center gap-2 ${isSelected ? 'text-[#003C48] font-bold bg-gray-50' : 'text-gray-800 font-medium active:bg-gray-50'}`}
                                    >
                                        <span>{pt.commDtlNm}</span>
                                        {isSelected && <span className="text-[#003C48]">✓</span>}
                                    </button>
                                );
                            })}
                            <div className="mx-4 h-[1px] bg-gray-100 my-2" />
                            <button
                                onClick={() => {
                                    setIsPublicTypeModalOpen(false);
                                    setItemToDelete(null);
                                }}
                                className="w-full py-3 text-gray-500 font-medium text-[15px] active:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- 서브 컴포넌트: 쇼츠 아이템 --- */
const ShortsVideoItem: React.FC<{
    item: FeedItem;
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
            videoRef.current.play().catch(() => {
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play();
                }
            });

            // Trigger view record once when visible
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
                className="w-full h-full object-cover bg-black"
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

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none pb-12 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                        profileImagePath={item.userProfileImagePath}
                        nickName={item.userNickNm}
                        userId={item.userId}
                        size={36}
                        className="border-white/40"
                    />
                    <span className="font-bold text-[15px] drop-shadow-md">@{item.userNickNm || item.userId}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 uppercase tracking-tighter">🎬 Shorts</span>
                </div>
                <div className="w-full">
                    <h3 className="text-[15px] leading-[1.4] line-clamp-3 font-medium drop-shadow-md">{item.title}</h3>
                </div>
            </div>
        </div>
    );
};

/* --- 서브 컴포넌트: 게시물 아이템 --- */
const PostFeedItem: React.FC<{
    post: FeedItem;
    onViewRecord: (newCount: number) => void;
}> = ({ post, onViewRecord }) => {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const itemRef = useRef<HTMLDivElement>(null);
    const hasViewBeenRecorded = useRef(false);
    const currentUserId = localStorage.getItem('userId');

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasViewBeenRecorded.current && post.postId) {
                    hasViewBeenRecorded.current = true;
                    fetch(`/api/sns/posts/${post.postId}/view?userId=${currentUserId || ''}`, { method: 'POST' })
                        .then(res => res.json())
                        .then(totalViews => onViewRecord(totalViews))
                        .catch(err => console.error("View record failed:", err));
                }
            },
            { threshold: 0.6 }
        );

        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [post.postId, currentUserId, onViewRecord]);

    const handleXScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollLeft, clientWidth } = e.currentTarget;
        const index = Math.round(scrollLeft / clientWidth);
        setCurrentImgIndex(index);
    };

    return (
        <div ref={itemRef} className="h-screen w-full snap-start relative flex flex-col items-center justify-center bg-black overflow-hidden">
            <div 
                onScroll={handleXScroll}
                className="relative w-full aspect-[4/5] bg-black flex overflow-x-scroll snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {post.imagePaths?.map((path, idx) => {
                    let imgEdit: any = null;
                    if (post.editDataList && post.editDataList[idx]) {
                        try {
                            imgEdit = JSON.parse(post.editDataList[idx]);
                        } catch (e) {}
                    }

                    const filterCss = imgEdit?.filter ? (
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

                    return (
                        <div key={idx} className="w-full h-full flex-shrink-0 snap-center snap-always flex items-center justify-center relative overflow-hidden bg-black">
                            <div 
                                className="w-full h-full flex items-center justify-center transition-transform duration-200"
                                style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                            >
                                <img src={path} alt={`post-${idx}`} className="w-full h-full object-cover" style={{ filter: filterCss }} />
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
                        </div>
                    );
                })}
                
                {post.imagePaths && post.imagePaths.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {post.imagePaths.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentImgIndex ? 'bg-white scale-110' : 'bg-white/30'}`} />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none pb-12 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <UserAvatar
                        profileImagePath={post.userProfileImagePath}
                        nickName={post.userNickNm}
                        userId={post.userId}
                        size={36}
                        className="border-white/40"
                    />
                    <span className="font-bold text-[15px] drop-shadow-md">@{post.userNickNm || post.userId}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 uppercase tracking-tighter">📸 Post</span>
                </div>
                <div className="w-full">
                    <p className="text-[14px] leading-[1.5] line-clamp-3 drop-shadow-md">{post.contentPreview}</p>
                </div>
            </div>
        </div>
    );
};

export default SnsUnifiedFeed;
