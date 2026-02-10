import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaThumbsUp, FaRegComment, FaChevronRight } from 'react-icons/fa';

interface HotPost {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    regDate: string;
    userNickNm: string | null;
    likeCnt: number;
    commentCnt: number;
    isLiked: boolean;
}

const Board: React.FC = () => {
    const navigate = useNavigate();
    const [hotPosts, setHotPosts] = useState<HotPost[]>([]);

    useEffect(() => {
        fetchHotPosts();
    }, []);

    const fetchHotPosts = async () => {
        try {
            // Retrieve userId from localStorage or context if available for 'isLiked' check
            // For now, passing generic or null if not handled strictly in frontend yet
            const userId = localStorage.getItem("userId") || "";
            const res = await fetch(`/api/boards/hot?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setHotPosts(data);
            } else {
                console.error("Failed to fetch hot posts");
            }
        } catch (e) {
            console.error("Error fetching hot posts", e);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        // YYYYMMDD... -> YYYY.MM.DD
        return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    const handlePostClick = (post: HotPost) => {
        // Navigate to post detail. Assuming route /main/board/detail/:boardNo
        navigate(`/main/board/detail/${post.boardNo}`);
    };

    return (
        <div className="p-4 pb-20" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <h2 className="text-xl font-bold text-[#003C48] mb-6">게시판</h2>

            {/* Hot Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-[#FF5A5A] mb-3 flex items-center gap-1">
                    # 🔥 Hot 🔥
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {hotPosts.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            최근 인기 게시글이 없습니다.
                        </div>
                    ) : (
                        hotPosts.map((post) => (
                            <div key={post.boardNo} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handlePostClick(post)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${post.boardTypeFg === "0" ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                {post.boardTypeFg === "0" ? '자유' : '초보'}
                                            </span>
                                            <h4 className="text-[#003C48] text-[15px] font-medium line-clamp-1">
                                                {post.title}
                                            </h4>
                                        </div>
                                    </div>
                                    <span className="text-gray-400 text-[11px] whitespace-nowrap">{formatDate(post.regDate)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-gray-500 text-[11px] bg-gray-50 px-2 py-0.5 rounded-full">
                                        <FaUser className="text-[10px]" />
                                        <span>{post.userNickNm || "익명"}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 text-[11px] bg-gray-50 px-2 py-0.5 rounded-full">
                                        <FaThumbsUp className="text-[10px]" />
                                        <span>({post.likeCnt})</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 text-[11px] bg-gray-50 px-2 py-0.5 rounded-full">
                                        <FaRegComment className="text-[10px]" />
                                        <span>({post.commentCnt})</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Board List Section */}
            <div>
                <h3 className="text-lg font-bold text-[#003C48] mb-3">게시판 목록</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/main/board/list/0`)}>
                        <span className="text-[#003C48] font-medium">자유 게시판</span>
                        <FaChevronRight className="text-[#003C48] text-sm" />
                    </div>
                    <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/main/board/list/1`)}>
                        <span className="text-[#003C48] font-medium">초보자 게시판</span>
                        <FaChevronRight className="text-[#003C48] text-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
