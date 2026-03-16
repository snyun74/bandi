import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaRegComment, FaRegTrashAlt } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const PAGE_SIZE = 20;

interface MyPostDto {
    postType: string;
    pkNo: number;
    param1: string | null;
    param2: string | null;
    title: string;
    likeCnt: number;
    replyCnt: number;
    regDate: string;
}

const getLabelStyle = (postType: string) => {
    switch (postType) {
        case 'CM_BOARD': return 'text-blue-600 bg-blue-50';
        case 'CN_NOTICE': return 'text-red-600 bg-red-50';
        case 'CN_BOARD': return 'text-green-600 bg-green-50';
        default: return 'text-gray-600 bg-gray-50';
    }
};

const getLabelName = (postType: string) => {
    switch (postType) {
        case 'CM_BOARD': return '일반게시';
        case 'CN_NOTICE': return '클랜공지';
        case 'CN_BOARD': return '클랜게시';
        default: return '게시물';
    }
};

const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 8) return dateStr;
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
};

const PostCard: React.FC<{ post: MyPostDto; onClick: () => void; onDelete?: (e: React.MouseEvent) => void }> = ({ post, onClick, onDelete }) => (
    <div onClick={onClick} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 relative group">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-8">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] mr-1 mb-1 ${getLabelStyle(post.postType)}`}>
                    {getLabelName(post.postType)}
                </span>
                <span className="text-[#003C48] font-bold text-[12px] leading-tight break-all">{post.title}</span>
            </div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">{formatDate(post.regDate)}</span>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                    <FaRegThumbsUp size={10} />
                    <span>({post.likeCnt ?? 0})</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                    <FaRegComment size={10} />
                    <span>({post.replyCnt ?? 0})</span>
                </div>
            </div>
            
            {onDelete && (
                <button 
                    onClick={onDelete}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="삭제"
                >
                    <FaRegTrashAlt size={14} />
                </button>
            )}
        </div>
    </div>
);

function useInfiniteList(apiUrl: string) {
    const [items, setItems] = useState<MyPostDto[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const loadMore = useCallback(async (pageNum: number) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}?page=${pageNum}&size=${PAGE_SIZE}`);
            if (res.ok) {
                const data: MyPostDto[] = await res.json();
                setItems(prev => pageNum === 0 ? data : [...prev, ...data]);
                setHasMore(data.length === PAGE_SIZE);
            }
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, loading]);

    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        loadMore(0);
    }, [apiUrl]);

    useEffect(() => {
        if (page === 0) return;
        loadMore(page);
    }, [page]);

    useEffect(() => {
        if (!bottomRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.5 });
        observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const removeItem = useCallback((postType: string, pkNo: number) => {
        setItems(prev => prev.filter(item => !(item.postType === postType && item.pkNo === pkNo)));
    }, []);

    return { items, loading, hasMore, bottomRef, removeItem };
}

const MyPostList: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const postsUrl = `/api/user/${userId}/posts`;
    const commentedUrl = `/api/user/${userId}/commented-posts`;

    const myPosts = useInfiniteList(postsUrl);
    const commentedPosts = useInfiniteList(commentedUrl);

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        type: "confirm" as "confirm" | "alert",
        message: "",
        onConfirm: () => { }
    });

    const handleClick = (post: MyPostDto) => {
        if (post.postType === 'CM_BOARD') {
            navigate(`/main/board/detail/${post.pkNo}`);
        } else if (post.postType === 'CN_NOTICE') {
            navigate(`/main/clan/notice/${post.param1}/detail/${post.pkNo}`);
        } else if (post.postType === 'CN_BOARD') {
            navigate(`/main/clan/board/${post.param1}/${post.param2}/post/${post.pkNo}`);
        }
    };

    const handleDelete = (e: React.MouseEvent, post: MyPostDto) => {
        e.stopPropagation(); // Prevent card click
        
        setModal({
            isOpen: true,
            type: "confirm",
            message: "정말 이 게시글을 삭제하시겠습니까?",
            onConfirm: () => performDelete(post)
        });
    };

    const performDelete = async (post: MyPostDto) => {
        setModal(prev => ({ ...prev, isOpen: false }));
        
        let url = '';
        let method = 'DELETE';
        let body: any = null;

        if (post.postType === 'CM_BOARD') {
            url = `/api/boards/posts/${post.pkNo}?userId=${userId}`;
            method = 'DELETE';
        } else if (post.postType === 'CN_BOARD') {
            url = `/api/clans/${post.param1}/boards/posts/${post.pkNo}/delete`;
            method = 'PUT';
            body = JSON.stringify({ userId });
        } else if (post.postType === 'CN_NOTICE') {
            url = `/api/clans/${post.param1}/notices/${post.pkNo}/delete`;
            method = 'PUT';
            body = JSON.stringify({ userId });
        }

        try {
            const res = await fetch(url, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : {},
                body
            });

            if (res.ok) {
                myPosts.removeItem(post.postType, post.pkNo);
                commentedPosts.removeItem(post.postType, post.pkNo);
                
                setModal({
                    isOpen: true,
                    type: "alert",
                    message: "삭제되었습니다.",
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            } else {
                setModal({
                    isOpen: true,
                    type: "alert",
                    message: "삭제에 실패했습니다.",
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error("Delete failed", error);
            setModal({
                isOpen: true,
                type: "alert",
                message: "오류가 발생했습니다.",
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const renderSection = (
        label: string,
        listProps: ReturnType<typeof useInfiniteList>
    ) => {
        const { items, loading, hasMore, bottomRef } = listProps;
        return (
            <div>
                <h2 className="text-[#003C48] font-bold text-[14px] mb-2 pl-1">{label}</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    {items.length === 0 && !loading ? (
                        <p className="text-center text-gray-400 text-sm py-6">
                            {label === '내가 쓴 글' ? '작성한 글이 없습니다.' : '댓글 작성한 글이 없습니다.'}
                        </p>
                    ) : (
                        items.map(post => (
                            <PostCard 
                                key={`${post.postType}-${post.pkNo}`} 
                                post={post} 
                                onClick={() => handleClick(post)} 
                                onDelete={label === '내가 쓴 글' ? (e) => handleDelete(e, post) : undefined}
                            />
                        ))
                    )}
                    {loading && (
                        <p className="text-center text-gray-400 text-xs py-3">불러오는 중...</p>
                    )}
                    {hasMore && <div ref={bottomRef} className="h-2" />}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-[14px] text-[#003C48] font-bold">내가 쓴 글</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {renderSection('내가 쓴 글', myPosts)}
                {renderSection('댓글 쓴 글', commentedPosts)}
            </div>

            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default MyPostList;
