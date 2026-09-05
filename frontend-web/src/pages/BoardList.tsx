import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPen, FaSearch, FaHeart, FaComment, FaTrashAlt } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import DefaultProfile from '../components/common/DefaultProfile';

interface BoardPost {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    regDate: string;
    userNickNm: string;
    writerUserId?: string;
    likeCnt: number;
    commentCnt: number;
    isLiked: boolean;
    content?: string;
    profileImg?: string;
    profileImageUrl?: string;
    maskingYn?: string;
}

const BoardList: React.FC = () => {
    const navigate = useNavigate();
    const { boardTypeFg } = useParams<{ boardTypeFg: string }>();
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const userId = localStorage.getItem("userId");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [onModalConfirm, setOnModalConfirm] = useState<(() => void) | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);

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
            const currentUserId = localStorage.getItem("userId") || "";
            const params = new URLSearchParams();
            params.append('boardTypeFg', boardTypeFg);
            params.append('userId', currentUserId);
            params.append('page', pageNum.toString());
            params.append('size', '30');
            if (searchQuery) params.append('keyword', searchQuery);

            const response = await fetch(`/api/boards?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                const newPosts = data.content || [];

                setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
                setHasMore(!data.last && newPosts.length === 30);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

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
        };
    }, [handleObserver]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(keyword);
    };

    const confirmDeletePost = (e: React.MouseEvent, boardNo: number) => {
        e.stopPropagation();
        setPostToDelete(boardNo);
        setIsDeleteConfirmOpen(true);
    };

    const handleDeletePost = async () => {
        if (!userId || !postToDelete) {
            setModalMessage('필수 정보가 누락되었습니다.');
            setOnModalConfirm(null);
            setIsModalOpen(true);
            return;
        }
        try {
            const res = await fetch(`/api/boards/posts/${postToDelete}?userId=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setIsDeleteConfirmOpen(false);
                setPostToDelete(null);
                setModalMessage('게시글이 삭제되었습니다.');
                setOnModalConfirm(() => () => {
                    setPosts([]);
                    setPage(0);
                    setHasMore(true);
                    fetchPosts(0, true);
                });
                setIsModalOpen(true);
            } else {
                setIsDeleteConfirmOpen(false);
                setPostToDelete(null);
                setModalMessage('삭제에 실패했습니다.');
                setOnModalConfirm(null);
                setIsModalOpen(true);
            }
        } catch (e) {
            console.error('Failed to delete post', e);
            setIsDeleteConfirmOpen(false);
            setPostToDelete(null);
            setModalMessage('오류가 발생했습니다.');
            setOnModalConfirm(null);
            setIsModalOpen(true);
        }
    };

    const formatShortDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        const y = dateStr.substring(2, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

    const handleWriteClick = () => {
        if (!userId) {
            alert("로그인이 필요한 서비스입니다.");
            return;
        }
        navigate(`/main/board/write/${boardTypeFg}`);
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
                    <h1 className="text-[18px] font-bold text-[#0B1114]">{boardName}</h1>
                </div>
                <button
                    onClick={handleWriteClick}
                    className="p-1.5 text-[#00BDF8] hover:text-[#00a8e0] active:scale-95 transition-all"
                    title="글쓰기"
                >
                    <FaPen size={18} />
                </button>
            </div>

            <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
                {/* Search */}
                <div>
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="제목으로 검색"
                            className="w-full bg-white border border-[#ECECEC] rounded-full py-2.5 pl-10 pr-4 text-sm text-[#2F2F31] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] shadow-[0px_2px_6px_rgba(0,0,0,0.02)] transition-all"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </form>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {posts.length > 0 ? (
                        posts.map((post) => {
                            const isAnonymous = post.maskingYn === 'Y' || (!post.userNickNm && !post.maskingYn);
                            const displayName = isAnonymous ? '익명' : (post.userNickNm || '익명');
                            const profileImgUrl = isAnonymous ? null : (post.profileImg || post.profileImageUrl);

                            return (
                                <div
                                    key={post.boardNo}
                                    onClick={() => navigate(`/main/board/detail/${post.boardNo}`)}
                                    className="bg-white rounded-[12px] p-[16px_20px] border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-gray-300 hover:shadow-md transition-all space-y-3"
                                >
                                    {/* 상단: 카테고리 뱃지 + 제목 + 작성일 */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-[#0098CC] text-[12px] font-bold leading-[14px] shrink-0">
                                                {post.boardTypeFg === '1' ? '초보자' : '자유'}
                                            </span>
                                            <h4 className="text-[14px] font-semibold leading-[18px] text-[#2F2F31] truncate">
                                                {post.title}
                                            </h4>
                                        </div>
                                        <span className="text-[10px] font-semibold leading-[14px] text-[#737373] shrink-0">
                                            {formatShortDate(post.regDate)}
                                        </span>
                                    </div>

                                    {/* 본문 미리보기 */}
                                    {post.content && (
                                        <p className="text-[14px] font-medium leading-[22px] text-[#55575B] line-clamp-2 whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                    )}

                                    {/* 하단: 작성자 프로필 + 좋아요/댓글 수 + 삭제 */}
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
                                            <span className="flex items-center gap-1 text-[12px] font-bold text-[#00BDF8]">
                                                <FaHeart size={11} className="text-[#00BDF8]" />
                                                {post.likeCnt || 0}
                                            </span>
                                            <span className="flex items-center gap-1 text-[12px] font-bold text-[#8E9196]">
                                                <FaComment size={11} className="text-[#D9D9DB]" />
                                                {post.commentCnt || 0}
                                            </span>
                                            {post.writerUserId === userId && (
                                                <button
                                                    onClick={(e) => confirmDeletePost(e, post.boardNo)}
                                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 font-medium pl-1 transition-colors"
                                                    title="게시글 삭제"
                                                >
                                                    <FaTrashAlt size={10} />
                                                    <span>삭제</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        !loading && (
                            <div className="bg-white rounded-[12px] p-8 text-center text-gray-400 text-xs border border-[#ECECEC]">
                                <p className="text-sm text-gray-500 mb-1">등록된 게시글이 없습니다.</p>
                                <p className="text-xs text-gray-400">첫 번째 이야기를 남겨보세요!</p>
                            </div>
                        )
                    )}

                    {/* 무한스크롤 감지 div */}
                    <div ref={lastPostRef} className="py-2 text-center">
                        {loading && (
                            <div className="py-4 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#00BDF8] border-t-transparent rounded-full animate-spin" />
                                <span>게시글을 불러오는 중...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 우하단 플로팅 글쓰기 FAB 버튼 */}
            <button
                onClick={handleWriteClick}
                className="fixed bottom-[calc(var(--nav-height,56px)+var(--safe-bottom,0px)+18px)] right-4 md:right-[max(1.25rem,calc((100vw-480px)/2+1.25rem))] w-[48px] h-[48px] rounded-full bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all z-40"
                aria-label="글쓰기"
            >
                <FaPen size={17} />
            </button>

            {/* Alert Modal */}
            <CommonModal
                isOpen={isModalOpen}
                type="alert"
                message={modalMessage}
                onConfirm={() => {
                    setIsModalOpen(false);
                    if (onModalConfirm) {
                        onModalConfirm();
                        setOnModalConfirm(null);
                    }
                }}
            />

            {/* Delete Confirm Modal */}
            <CommonModal
                isOpen={isDeleteConfirmOpen}
                type="confirm"
                message="게시글을 삭제하시겠습니까?"
                onConfirm={handleDeletePost}
                onCancel={() => {
                    setIsDeleteConfirmOpen(false);
                    setPostToDelete(null);
                }}
            />
        </div>
    );
};

export default BoardList;
