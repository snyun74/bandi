import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaRegComment } from 'react-icons/fa';

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

const PostCard: React.FC<{ post: MyPostDto; onClick: () => void }> = ({ post, onClick }) => (
    <div onClick={onClick} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 pr-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] mr-1 mb-1 ${getLabelStyle(post.postType)}`}>
                    {getLabelName(post.postType)}
                </span>
                <span className="text-[#003C48] font-bold text-sm leading-tight break-all">{post.title}</span>
            </div>
            <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1">{formatDate(post.regDate)}</span>
        </div>
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

    return { items, loading, hasMore, bottomRef };
}

const MyPostList: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const postsUrl = `/api/user/${userId}/posts`;
    const commentedUrl = `/api/user/${userId}/commented-posts`;

    const myPosts = useInfiniteList(postsUrl);
    const commentedPosts = useInfiniteList(commentedUrl);

    const handleClick = (post: MyPostDto) => {
        if (post.postType === 'CM_BOARD') {
            navigate(`/main/board/detail/${post.pkNo}`);
        } else if (post.postType === 'CN_NOTICE') {
            navigate(`/main/clan/notice/${post.param1}/detail/${post.pkNo}`);
        } else if (post.postType === 'CN_BOARD') {
            navigate(`/main/clan/board/${post.param1}/${post.param2}/post/${post.pkNo}`);
        }
    };

    const renderSection = (
        label: string,
        { items, loading, hasMore, bottomRef }: ReturnType<typeof useInfiniteList>
    ) => (
        <div>
            <h2 className="text-[#003C48] font-bold text-base mb-2 pl-1">{label}</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {items.length === 0 && !loading ? (
                    <p className="text-center text-gray-400 text-sm py-6">
                        {label === '내가 쓴 글' ? '작성한 글이 없습니다.' : '댓글 작성한 글이 없습니다.'}
                    </p>
                ) : (
                    items.map(post => (
                        <PostCard key={`${post.postType}-${post.pkNo}`} post={post} onClick={() => handleClick(post)} />
                    ))
                )}
                {loading && (
                    <p className="text-center text-gray-400 text-xs py-3">불러오는 중...</p>
                )}
                {hasMore && <div ref={bottomRef} className="h-2" />}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">내가 쓴 글</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {renderSection('내가 쓴 글', myPosts)}
                {renderSection('댓글 쓴 글', commentedPosts)}
            </div>
        </div>
    );
};

export default MyPostList;
