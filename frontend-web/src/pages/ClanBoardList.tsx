import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaChevronRight, FaMinusCircle, FaRegCommentDots } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface HotPost {
    id: number;
    title: string;
    author: string;
    likeCount: number;
    replyCount: number;
    date: string;
    isHot: boolean;
    boardTypeNo: number;
}

interface BoardCategory {
    id: number;
    name: string;
    type: string;
}

const ClanBoardList: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();

    const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
    const [boards, setBoards] = useState<BoardCategory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [userRole, setUserRole] = useState<string>(""); // '01': Leader, '02': Executive
    const userId = localStorage.getItem('userId');

    // CommonModal State
    const [commonModal, setCommonModal] = useState<{
        isOpen: boolean;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        message: "",
        type: 'alert',
        onConfirm: () => { }
    });

    const closeCommonModal = () => {
        setCommonModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchHotPosts = async () => {
        if (!clanId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/boards/hot`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const mappedPosts = data.map((item: any) => ({
                        id: item.cnBoardNo,
                        title: item.title,
                        author: item.userNickNm,
                        likeCount: item.boardLikeCnt,
                        replyCount: item.boardReplyCnt,
                        date: item.regDate && item.regDate.length >= 8 ?
                            `${item.regDate.substring(0, 4)}.${item.regDate.substring(4, 6)}.${item.regDate.substring(6, 8)}` : item.regDate,
                        isHot: true,
                        boardTypeNo: item.cnBoardTypeNo || 0
                    }));
                    setHotPosts(mappedPosts);
                }
            }
        } catch (error) {
            console.error("Failed to fetch hot posts", error);
        }
    };

    const fetchUserRole = async () => {
        if (!clanId || !userId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/members/${userId}/role`);
            if (response.ok) {
                const role = await response.text();
                setUserRole(role);
            }
        } catch (error) {
            console.error("Failed to fetch user role", error);
        }
    };

    const fetchBoards = async () => {
        if (!clanId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/boards/types`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const mappedBoards = data.map((item: any) => ({
                        id: item.cnBoardTypeNo,
                        name: item.cnBoardTypeNm,
                        type: item.boardTypeStatCd
                    }));
                    setBoards(mappedBoards);
                }
            }
        } catch (error) {
            console.error("Failed to fetch board types", error);
        }
    };

    useEffect(() => {
        fetchHotPosts();
        fetchBoards();
        fetchUserRole();
    }, [clanId]);

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) {
            setCommonModal({
                isOpen: true,
                message: "게시판 이름을 입력해주세요.",
                type: 'alert',
                onConfirm: closeCommonModal
            });
            return;
        }
        if (!clanId) return;

        try {
            const response = await fetch(`/api/clans/${clanId}/boards/types`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cnNo: clanId,
                    cnBoardTypeNm: newBoardName,
                    userId: 'admin' // Fixed as per instruction/current capability (should be real user ID)
                }),
            });

            if (response.ok) {
                setCommonModal({
                    isOpen: true,
                    message: "게시판이 추가되었습니다.",
                    type: 'alert',
                    onConfirm: () => {
                        closeCommonModal();
                        setNewBoardName("");
                        setIsModalOpen(false);
                        fetchBoards(); // Refresh list
                    }
                });
            } else {
                setCommonModal({
                    isOpen: true,
                    message: "게시판 생성에 실패했습니다.",
                    type: 'alert',
                    onConfirm: closeCommonModal
                });
            }
        } catch (error) {
            console.error("Failed to create board", error);
            setCommonModal({
                isOpen: true,
                message: "오류가 발생했습니다.",
                type: 'alert',
                onConfirm: closeCommonModal
            });
        }
    };

    const handleDeleteBoard = (e: React.MouseEvent, board: BoardCategory) => {
        e.stopPropagation(); // Prevent navigation
        setCommonModal({
            isOpen: true,
            message: `'${board.name}' 게시판을 삭제하시겠습니까?`,
            type: 'confirm',
            onConfirm: () => {
                deleteBoard(board.id);
            },
            onCancel: closeCommonModal
        });
    };

    const deleteBoard = async (boardId: number) => {
        if (!clanId || !userId) return;
        try {
            const response = await fetch(`/api/clans/${clanId}/boards/types/${boardId}/delete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId }),
            });

            if (response.ok) {
                // Success: Just close modal and refresh
                closeCommonModal();
                fetchBoards();
            } else {
                const errorData = await response.json();
                setCommonModal({
                    isOpen: true,
                    message: errorData.message || "게시판 삭제에 실패했습니다.",
                    type: 'alert',
                    onConfirm: closeCommonModal
                });
            }
        } catch (error) {
            console.error("Failed to delete board", error);
            setCommonModal({
                isOpen: true,
                message: "오류가 발생했습니다.",
                type: 'alert',
                onConfirm: closeCommonModal
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">클랜 게시판</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10 relative">

                {/* Hot Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#FF5252] font-bold text-lg"># 🔥 Hot 🔥</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="divide-y divide-gray-100">
                            {hotPosts.length > 0 ? (
                                hotPosts.map((post) => (
                                    <div key={post.id} className="py-3 first:pt-0 last:pb-0" onClick={() => navigate(`/main/clan/board/${clanId}/${post.boardTypeNo}/post/${post.id}`)}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-[#003C48] text-sm font-medium truncate flex-1 pr-2">{post.title}</h3>
                                            <span className="text-gray-400 text-xs whitespace-nowrap">{post.date}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-500">
                                                <span className="text-xs">👤</span>
                                                <span>{post.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2 float-right">
                                                <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                                                    <FaRegCommentDots size={10} />
                                                    <span>({post.replyCount})</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-[#FF5252] bg-red-50 px-2 py-0.5 rounded">
                                                    <FaRegThumbsUp size={10} />
                                                    <span>({post.likeCount})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    <p>아직 인기 게시글이 없어요! 😅</p>
                                    <p className="text-xs mt-1">첫 번째 인기글의 주인공이 되어보세요!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Board List Section */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[#003C48] font-bold text-lg">게시판 목록</h2>
                        {(userRole === '01' || userRole === '02') && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                            >
                                게시판 생성
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {boards.map((board) => (
                                <div
                                    key={board.id}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => navigate(`/main/clan/board/${clanId}/${board.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        {(userRole === '01' || userRole === '02') && (
                                            <div onClick={(e) => handleDeleteBoard(e, board)}>
                                                <FaMinusCircle className="text-[#FF8A80] hover:text-red-500 transition-colors" size={20} />
                                            </div>
                                        )}
                                        <span className="text-[#003C48] font-medium">{board.name}</span>
                                    </div>
                                    <FaChevronRight className="text-gray-400" size={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Overlay */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in-up">
                            <h3 className="text-lg font-bold text-[#003C48] mb-4 text-center">클랜 게시판 추가하기</h3>
                            <input
                                type="text"
                                placeholder="추가할 게시판 이름을 입력하세요."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BDF8] mb-4"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleCreateBoard}
                                    className="flex-1 bg-[#00BDF8] text-white py-3 rounded-xl font-bold text-sm shadow-md"
                                >
                                    게시판 추가하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Result Modal */}
                <CommonModal
                    isOpen={commonModal.isOpen}
                    type={commonModal.type}
                    message={commonModal.message}
                    onConfirm={commonModal.onConfirm}
                    onCancel={commonModal.onCancel}
                />

            </div>
        </div>
    );
};

export default ClanBoardList;
