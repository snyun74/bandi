import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPen, FaSearch, FaRegThumbsUp, FaRegCommentDots } from 'react-icons/fa';

interface BoardPost {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    regDate: string;
    userNickNm: string;
    likeCnt: number;
    commentCnt: number;
    isLiked: boolean;
}

const BoardList: React.FC = () => {
    const navigate = useNavigate();
    const { boardTypeFg } = useParams<{ boardTypeFg: string }>();
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    const boardName = boardTypeFg === '0' ? "자유 게시판" : "초보자 게시판";

    // Reset list when board type or search query changes
    useEffect(() => {
        setPosts([]);
        setPage(0);
        setHasMore(true);
        fetchPosts(0, true);
    }, [boardTypeFg, searchQuery]);

    const fetchPosts = async (pageNum: number, isReset: boolean = false) => {
        if (!boardTypeFg) return;
        setLoading(true);
        try {
            const userId = localStorage.getItem("userId") || "";
            const params = new URLSearchParams();
            params.append('boardTypeFg', boardTypeFg);
            params.append('userId', userId);
            params.append('page', pageNum.toString());
            params.append('size', '30'); // Limit to 30 as requested
            if (searchQuery) params.append('keyword', searchQuery);

            const response = await fetch(`/api/boards?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const newPosts = data.content || [];

                setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
                // If fewer items than requested size, then no more pages
                setHasMore(!data.last && newPosts.length === 30);
            } else {
                setHasMore(false); // Stop on error
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            setHasMore(false); // Stop on error
        } finally {
            setLoading(false);
        }
    };

    // Intersection Observer callback
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
            setPage(prev => {
                const nextPage = prev + 1;
                fetchPosts(nextPage);
                return nextPage;
            });
        }
    }, [hasMore, loading]);

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 0
        };
        observer.current = new IntersectionObserver(handleObserver, option);
        if (lastPostRef.current) observer.current.observe(lastPostRef.current);

        return () => {
            if (observer.current) observer.current.disconnect();
        }
    }, [handleObserver, lastPostRef.current]); // Re-attach observer when ref changes or dependencies change?
    // Actually better logic for observer:
    // Attach to a sentinel div at the bottom.

    useEffect(() => {
        // Re-connect observer when loading state or hasMore changes to ensure we don't trigger while loading
        // But actually the callback handles the check.
        // We just need to make sure the observer observes the CURRENT ref.
        if (observer.current && lastPostRef.current) {
            observer.current.disconnect();
            observer.current.observe(lastPostRef.current);
        }
    }, [handleObserver]);


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(keyword);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    const handleWriteClick = () => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("로그인이 필요한 서비스입니다.");
            return;
        }
        navigate(`/main/board/write/${boardTypeFg}`);
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2 bg-white sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">{boardName}</h1>
                </div>
                <button
                    onClick={handleWriteClick}
                    className="text-[#00BDF8]"
                >
                    <FaPen size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="검색"
                        className="w-full border border-[#00BDF8] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00BDF8]" size={16} />
                </form>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-10">
                <div className="divide-y divide-gray-100">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <div key={post.boardNo}
                                onClick={() => navigate(`/main/board/detail/${post.boardNo}`)}
                                className="py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-[#003C48] text-[15px] font-medium truncate flex-1 pr-2">{post.title}</h3>
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{formatDate(post.regDate)}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500">
                                        <span className="text-xs">👤</span>
                                        <span>{post.userNickNm || "익명"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {post.commentCnt > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                                <FaRegCommentDots size={12} />
                                                <span>({post.commentCnt})</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                            <FaRegThumbsUp size={12} />
                                            <span>({post.likeCnt})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div className="py-10 text-center text-gray-400 text-sm">
                                <p>게시글이 없습니다.</p>
                            </div>
                        )
                    )}

                    {/* Sentinel for Infinite Scroll */}
                    {hasMore && (
                        <div ref={lastPostRef} className="py-4 text-center">
                            {loading && <div className="text-gray-400 text-xs">Loading...</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BoardList;
