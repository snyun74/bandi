import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaMinusCircle, FaHeart, FaComment, FaFire, FaPlus, FaFolder } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import DefaultProfile from '../components/common/DefaultProfile';

interface HotPost {
    id: number;
    title: string;
    author: string;
    likeCount: number;
    replyCount: number;
    date: string;
    isHot: boolean;
    boardTypeNo: number;
    boardTypeNm?: string;
    content?: string;
    profileImg?: string;
    maskingYn?: string;
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
            const response = await fetch(`/api/clans/${clanId}/boards/hot?userId=${userId || ''}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const mappedPosts = data.map((item: any) => ({
                        id: item.cnBoardNo,
                        title: item.title,
                        author: item.userNickNm || '익명',
                        likeCount: item.boardLikeCnt || 0,
                        replyCount: item.boardReplyCnt || 0,
                        date: item.regDate || '',
                        isHot: true,
                        boardTypeNo: item.cnBoardTypeNo || 0,
                        boardTypeNm: item.boardTypeNm,
                        content: item.content,
                        profileImg: item.profileImageUrl,
                        maskingYn: item.maskingYn
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

    const formatShortDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr || '';
        const y = dateStr.substring(2, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        return `${y}.${m}.${d}`;
    };

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
                    userId: userId || 'admin'
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
        <div className="flex flex-col min-h-screen bg-[#F7F9FC] font-['Pretendard'] text-gray-900 pb-16 relative">
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
                    <h1 className="text-[18px] font-bold text-[#0B1114]">클랜 게시판</h1>
                </div>
                {(userRole === '01' || userRole === '02') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1.5 bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full shadow-xs transition-all"
                    >
                        <FaPlus size={11} />
                        <span>게시판 추가</span>
                    </button>
                )}
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
                {/* 1. Hot 인기 게시글 */}
                <section>
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-[#FF5A5A] flex items-center gap-1 font-bold text-[15px]">
                            <FaFire size={14} />
                            클랜 핫이슈
                        </span>
                    </div>

                    <div className="space-y-3">
                        {hotPosts.length === 0 ? (
                            <div className="bg-white rounded-[12px] p-6 text-center text-gray-400 text-xs border border-[#ECECEC]">
                                아직 인기 게시글이 없습니다.
                            </div>
                        ) : (
                            hotPosts.map((post) => {
                                const isAnonymous = post.maskingYn === 'Y' || (!post.author && !post.maskingYn);
                                const displayName = isAnonymous ? '익명' : (post.author || '익명');
                                const profileImgUrl = isAnonymous ? null : post.profileImg;

                                return (
                                    <div
                                        key={`clan-hot-${post.id}`}
                                        onClick={() => navigate(`/main/clan/board/${clanId}/${post.boardTypeNo}/post/${post.id}`)}
                                        className="bg-white rounded-[12px] p-[16px_20px] border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:border-gray-300 hover:shadow-md transition-all space-y-3"
                                    >
                                        {/* 상단: 카테고리 뱃지 + 제목 + 작성일 */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-[#0098CC] text-[12px] font-bold leading-[14px] shrink-0">
                                                    {post.boardTypeNm || '인기글'}
                                                </span>
                                                <h4 className="text-[14px] font-semibold leading-[18px] text-[#2F2F31] truncate">
                                                    {post.title}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-semibold leading-[14px] text-[#737373] shrink-0">
                                                {formatShortDate(post.date)}
                                            </span>
                                        </div>

                                        {/* 본문 미리보기 */}
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
                                                    {post.likeCount || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-[12px] font-bold text-[#8E9196]">
                                                    <FaComment size={11} className="text-[#D9D9DB]" />
                                                    {post.replyCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* 2. 게시판 목록 (카테고리 리스트) */}
                <section>
                    <div className="flex items-center justify-between mb-2.5">
                        <h2 className="text-[15px] font-bold text-[#0B1114]">게시판 목록</h2>
                    </div>

                    <div className="bg-white rounded-[14px] border border-[#ECECEC] shadow-[0px_2px_8px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-[#F1F3F5]">
                        {boards.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-xs">
                                등록된 게시판이 없습니다.
                            </div>
                        ) : (
                            boards.map((board) => (
                                <div
                                    key={board.id}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors group"
                                    onClick={() => navigate(`/main/clan/board/${clanId}/${board.id}`)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {(userRole === '01' || userRole === '02') && (
                                            <button
                                                onClick={(e) => handleDeleteBoard(e, board)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 -m-1 shrink-0"
                                                title="게시판 삭제"
                                            >
                                                <FaMinusCircle size={17} />
                                            </button>
                                        )}
                                        <div className="w-8 h-8 rounded-lg bg-[#F0F7FA] text-[#0098CC] flex items-center justify-center shrink-0">
                                            <FaFolder size={14} />
                                        </div>
                                        <span className="text-[#2F2F31] font-semibold text-[15px] group-hover:text-[#00BDF8] transition-colors truncate">
                                            {board.name}
                                        </span>
                                    </div>
                                    <FaChevronRight className="text-gray-300 group-hover:text-[#00BDF8] group-hover:translate-x-0.5 transition-all shrink-0" size={13} />
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* 게시판 추가 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in-up">
                        <h3 className="text-[17px] font-bold text-[#0B1114] mb-2 text-center">클랜 게시판 추가</h3>
                        <p className="text-xs text-gray-500 text-center mb-4">새로 개설할 게시판 이름을 입력해 주세요.</p>
                        <input
                            type="text"
                            placeholder="예: 공지사항, 정기모임 후기"
                            className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#2F2F31] focus:outline-none focus:ring-2 focus:ring-[#00BDF8] mb-4 placeholder-gray-400"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewBoardName("");
                                }}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateBoard}
                                className="flex-1 bg-[#00BDF8] hover:bg-[#00a8e0] text-white py-3 rounded-xl font-bold text-sm shadow-xs transition-colors"
                            >
                                추가하기
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
    );
};

export default ClanBoardList;
