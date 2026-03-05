import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPen, FaSearch, FaRegThumbsUp, FaRegCommentDots } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import SectionTitle from '../components/common/SectionTitle';

interface BoardPost {
    cnBoardNo: number;
    title: string;
    regDate: string;
    userNickNm: string;
    writerUserId?: string;
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
    const userId = localStorage.getItem('userId');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [onModalConfirm, setOnModalConfirm] = useState<(() => void) | null>(null);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<number | null>(null);
    const [clanRole, setClanRole] = useState<string>('NONE'); // '01': Leader, '02': Executive

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

    const fetchClanRole = async () => {
        if (!clanId || !userId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/members/${userId}/role`);
            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    setClanRole(data.role || text);
                } catch {
                    setClanRole(text); // If it's just raw string
                }
            }
        } catch (error) {
            console.error("Failed to fetch clan role", error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchBoardName();
        fetchClanRole();
    }, [boardTypeNo, searchQuery, clanId, userId]);

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
        if (!userId || !postToDelete || !clanId) {
            setModalMessage('필수 정보가 누락되었습니다.');
            setOnModalConfirm(null);
            setIsModalOpen(true);
            return;
        }
        try {
            const res = await fetch(`/api/clans/${clanId}/boards/posts/${postToDelete}/delete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (res.ok) {
                setIsDeleteConfirmOpen(false);
                setPostToDelete(null);
                setModalMessage(data.message || '게시글이 삭제되었습니다.');
                setOnModalConfirm(() => () => {
                    fetchPosts(); // Reload the list
                });
                setIsModalOpen(true);
            } else {
                setIsDeleteConfirmOpen(false);
                setPostToDelete(null);
                setModalMessage(data.message || '삭제에 실패했습니다.');
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

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 mb-2 bg-white sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="text-[#052c42] mr-4">
                        <FaChevronLeft size={24} />
                    </button>
                    <SectionTitle as="h1" className="!mt-0 !mb-0">{boardName || '게시판'}</SectionTitle>
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
                                <div className="flex items-center gap-3 mt-1 justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500">
                                            <span className="text-xs">👤</span>
                                            <span>{post.userNickNm}</span>
                                        </div>
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
                                        {(post.writerUserId === userId || clanRole === '01' || clanRole === '02') && (
                                            <button
                                                onClick={(e) => confirmDeletePost(e, post.cnBoardNo)}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-0.5"
                                            >
                                                삭제
                                            </button>
                                        )}
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

export default ClanBoardPostList;
