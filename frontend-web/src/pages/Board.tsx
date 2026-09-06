import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaComment, FaPen, FaFire, FaComments, FaGraduationCap } from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';

interface HotPost {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    regDate: string;
    userNickNm: string | null;
    likeCnt: number;
    commentCnt: number;
    isLiked: boolean;
    content?: string;
    profileImg?: string;
    profileImageUrl?: string;
    maskingYn?: string;
}

const Board: React.FC = () => {
    const navigate = useNavigate();
    const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
    
    // Recent posts state for infinite scroll
    const [recentPosts, setRecentPosts] = useState<HotPost[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHotPosts();
    }, []);

    useEffect(() => {
        fetchRecentPosts();
    }, [page]);

    const fetchHotPosts = async () => {
        try {
            const userId = localStorage.getItem("userId") || "";
            const res = await fetch(`/api/boards/hot?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setHotPosts(data);
            }
        } catch (e) {
            console.error("Error fetching hot posts", e);
        }
    };

    const fetchRecentPosts = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const userId = localStorage.getItem("userId") || "";
            const res = await fetch(`/api/boards/recent?userId=${userId}&page=${page}&size=30`);
            if (res.ok) {
                const data = await res.json();
                const newPosts = data.content || [];
                setRecentPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.boardNo));
                    const filteredNew = newPosts.filter((p: HotPost) => !existingIds.has(p.boardNo));
                    return [...prev, ...filteredNew];
                });
                setHasMore(!data.last);
            }
        } catch (e) {
            console.error("Error fetching recent posts", e);
        } finally {
            setLoading(false);
        }
    };

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const formatShortDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        const y = dateStr.substring(2, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

    const handlePostClick = (boardNo: number) => {
        navigate(`/main/board/detail/${boardNo}`);
    };

    const renderPostCard = (post: HotPost, isHotItem: boolean = false) => {
        const isAnonymous = post.maskingYn === 'Y' || (!post.userNickNm && !post.maskingYn);
        const displayName = isAnonymous ? '익명' : (post.userNickNm || '익명');
        const profileImgUrl = isAnonymous ? null : (post.profileImg || post.profileImageUrl);

        return (
            <div
                key={`${isHotItem ? 'hot' : 'recent'}-${post.boardNo}`}
                onClick={() => handlePostClick(post.boardNo)}
                className="bg-white rounded-[12px] p-[16px_20px] border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-gray-300 hover:shadow-md transition-all space-y-3"
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

                {/* 본문 미리보기 (있는 경우 표시) */}
                {post.content && (
                    <p className="text-[14px] font-medium leading-[22px] text-[#55575B] line-clamp-2 whitespace-pre-wrap">
                        {post.content}
                    </p>
                )}

                {/* 하단: 작성자 프로필 + 좋아요/댓글 수 */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-[26px] h-[26px] rounded-full overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center bg-gray-100">
                            {profileImgUrl ? (
                                <img
                                    src={profileImgUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <DefaultProfile type="user" iconSize={12} className="w-full h-full" />
                            )}
                        </div>
                        <span className="text-[14px] font-semibold leading-[18px] text-[#2F2F31] truncate">
                            {displayName}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-[12px] font-bold text-red-500">
                            <FaHeart size={11} className="text-red-500" />
                            {post.likeCnt || 0}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-[#8E9196]">
                            <FaComment size={11} className="text-[#D9D9DB]" />
                            {post.commentCnt || 0}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F7F9FC] font-['Pretendard'] text-gray-900 pb-20 relative">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 -ml-1 text-[#2F2F31] hover:text-[#00BDF8] transition-colors"
                        aria-label="뒤로가기"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#0B1114]">커뮤니티 게시판</h1>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
                {/* 1. 카테고리 카드 바로가기 */}
                <section>
                    <div className="flex items-center justify-between mb-2.5">
                        <h2 className="text-[15px] font-bold text-[#0B1114]">게시판 둘러보기</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div
                            onClick={() => navigate('/main/board/list/0')}
                            className="bg-white rounded-[14px] p-4 border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#00BDF8] hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-[#E6F7FE] text-[#0098CC] flex items-center justify-center text-lg">
                                    <FaComments size={18} />
                                </div>
                                <FaChevronRight size={12} className="text-gray-300 group-hover:text-[#00BDF8] group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-[#2F2F31] group-hover:text-[#00BDF8] transition-colors">자유 게시판</h3>
                                <p className="text-[11px] text-[#737373] mt-0.5">밴드 이야기와 일상 소통</p>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/main/board/list/1')}
                            className="bg-white rounded-[14px] p-4 border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-[#00BDF8] hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-[#FFF4E6] text-[#FF922B] flex items-center justify-center text-lg">
                                    <FaGraduationCap size={18} />
                                </div>
                                <FaChevronRight size={12} className="text-gray-300 group-hover:text-[#FF922B] group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-[#2F2F31] group-hover:text-[#FF922B] transition-colors">초보자 게시판</h3>
                                <p className="text-[11px] text-[#737373] mt-0.5">악기·밴드 입문자 Q&A</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Hot 인기 게시글 */}
                <section>
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-[#FF5A5A] flex items-center gap-1 font-bold text-[15px]">
                            <FaFire size={14} />
                            실시간 핫이슈
                        </span>
                    </div>

                    <div className="space-y-3">
                        {hotPosts.length === 0 ? (
                            <div className="bg-white rounded-[12px] p-6 text-center text-gray-400 text-xs border border-[#ECECEC]">
                                최근 인기 게시글이 없습니다.
                            </div>
                        ) : (
                            hotPosts.map((post) => renderPostCard(post, true))
                        )}
                    </div>
                </section>

                {/* 3. 최근 게시글 (무한 스크롤) */}
                <section>
                    <div className="flex items-center justify-between mb-2.5">
                        <h2 className="text-[15px] font-bold text-[#0B1114]">최신 이야기</h2>
                    </div>

                    <div className="space-y-3">
                        {recentPosts.length === 0 && !loading ? (
                            <div className="bg-white rounded-[12px] p-6 text-center text-gray-400 text-xs border border-[#ECECEC]">
                                아직 등록된 게시글이 없습니다.
                            </div>
                        ) : (
                            recentPosts.map((post, index) => {
                                const isLast = index === recentPosts.length - 1;
                                return (
                                    <div ref={isLast ? lastPostElementRef : null} key={`recent-${post.boardNo}`}>
                                        {renderPostCard(post, false)}
                                    </div>
                                );
                            })
                        )}

                        {loading && (
                            <div className="py-4 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#00BDF8] border-t-transparent rounded-full animate-spin" />
                                <span>게시글을 불러오는 중...</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* 우하단 플로팅 글쓰기 FAB 버튼 */}
            <button
                onClick={() => navigate('/main/board/write/0')}
                className="fixed bottom-[calc(var(--nav-height,56px)+var(--safe-bottom,0px)+18px)] right-4 md:right-[max(1.25rem,calc((100vw-480px)/2+1.25rem))] w-[48px] h-[48px] rounded-full bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all z-40"
                aria-label="글쓰기"
            >
                <FaPen size={17} />
            </button>
        </div>
    );
};

export default Board;
