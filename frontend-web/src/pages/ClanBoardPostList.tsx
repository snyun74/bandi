import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPen, FaSearch, FaRegThumbsUp, FaRegCommentDots } from 'react-icons/fa';

interface BoardPost {
    cnBoardNo: number;
    title: string;
    regDate: string;
    userNickNm: string;
    boardLikeCnt: number;
    boardReplyCnt: number;
}

const ClanBoardPostList: React.FC = () => {
    const navigate = useNavigate();
    const { clanId, boardTypeNo } = useParams<{ clanId: string; boardTypeNo: string }>();
    const [posts, setPosts] = useState<BoardPost[]>([]);
    const [keyword, setKeyword] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [boardName, setBoardName] = useState("");

    const fetchPosts = async () => {
        if (!boardTypeNo) return;
        try {
            const query = searchQuery ? `?keyword=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/clans/boards/${boardTypeNo}/posts${query}`);
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
        }
    };

    const fetchBoardName = async () => {
        // Optional: Fetch board name if not passed via state. 
        // For now, we can try to find it from the list of types if cached, or fetch again.
        // Or simply display generic "게시판" if not critical, or fetch the single type detail.
        // Assuming we might have passed state, but for deep links, we should ideally fetch.
        // Let's implement a simple fetch or use a placeholder.
        if (!boardTypeNo || !clanId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/boards/types`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const board = data.find((b: any) => b.cnBoardTypeNo === Number(boardTypeNo));
                    if (board) setBoardName(board.cnBoardTypeNm);
                }
            }
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        fetchPosts();
        fetchBoardName();
    }, [boardTypeNo, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(keyword);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2 bg-white sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">{boardName || '게시판'}</h1>
                </div>
                <button
                    onClick={() => navigate(`/main/clan/board/${clanId}/${boardTypeNo}/create`)}
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
                            <div key={post.cnBoardNo}
                                onClick={() => navigate(`/main/clan/board/${clanId}/${boardTypeNo}/post/${post.cnBoardNo}`)}
                                className="py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-[#003C48] text-[15px] font-medium truncate flex-1 pr-2">{post.title}</h3>
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{formatDate(post.regDate)}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500">
                                        <span className="text-xs">👤</span>
                                        <span>{post.userNickNm}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {post.boardReplyCnt > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                                <FaRegCommentDots size={12} />
                                                <span>({post.boardReplyCnt})</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                            <FaRegThumbsUp size={12} />
                                            <span>({post.boardLikeCnt})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            <p>게시글이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClanBoardPostList;
