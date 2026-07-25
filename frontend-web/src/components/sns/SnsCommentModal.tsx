import React, { useEffect, useState } from 'react';
import { FaTimes, FaPaperPlane, FaTrash } from 'react-icons/fa';
import UserAvatar from '../common/UserAvatar';

export interface CommentItem {
    replyNo: number;
    targetId: number;
    replyUserId: string;
    replyUserNickNm: string;
    replyUserProfileImagePath?: string | null;
    content: string;
    insDtime: string;
}

interface SnsCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'POST' | 'SHORTS';
    targetId: number;
    onCommentCountChange?: (newCount: number) => void;
}

const SnsCommentModal: React.FC<SnsCommentModalProps> = ({
    isOpen,
    onClose,
    type,
    targetId,
    onCommentCountChange
}) => {
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [inputContent, setInputContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentUserId = localStorage.getItem('userId');

    const fetchComments = async () => {
        if (!targetId) return;
        setIsLoading(true);
        try {
            const url = type === 'POST'
                ? `/api/sns/posts/${targetId}/comments`
                : `/api/sns/shorts/${targetId}/comments`;
            const res = await fetch(url);
            if (res.ok) {
                const data: CommentItem[] = await res.json();
                setComments(data);
                if (onCommentCountChange) {
                    onCommentCountChange(data.length);
                }
            }
        } catch (err) {
            console.error("Failed to load comments:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && targetId) {
            fetchComments();
        }
    }, [isOpen, targetId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputContent.trim() || !currentUserId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const url = type === 'POST'
                ? `/api/sns/posts/${targetId}/comments`
                : `/api/sns/shorts/${targetId}/comments`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    content: inputContent.trim()
                })
            });

            if (res.ok) {
                const newComment: CommentItem = await res.json();
                const updatedList = [...comments, newComment];
                setComments(updatedList);
                setInputContent('');
                if (onCommentCountChange) {
                    onCommentCountChange(updatedList.length);
                }
            } else {
                const errText = await res.text();
                alert(errText || "댓글 등록에 실패했습니다.");
            }
        } catch (err) {
            console.error("Failed to post comment:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (replyNo: number) => {
        if (!currentUserId) return;
        try {
            const url = type === 'POST'
                ? `/api/sns/posts/comments/${replyNo}?userId=${currentUserId}`
                : `/api/sns/shorts/comments/${replyNo}?userId=${currentUserId}`;

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                const updatedList = comments.filter(c => c.replyNo !== replyNo);
                setComments(updatedList);
                if (onCommentCountChange) {
                    onCommentCountChange(updatedList.length);
                }
            }
        } catch (err) {
            console.error("Failed to delete comment:", err);
        }
    };

    const formatDate = (dtime: string) => {
        if (!dtime || dtime.length < 12) return dtime;
        const year = dtime.substring(0, 4);
        const month = dtime.substring(4, 6);
        const day = dtime.substring(6, 8);
        const hour = dtime.substring(8, 10);
        const min = dtime.substring(10, 12);
        return `${year}.${month}.${day} ${hour}:${min}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Bottom Sheet Container */}
            <div className="relative w-full max-w-lg bg-[#18181b] text-white rounded-t-[24px] h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden border-t border-white/10">
                {/* Header Handle */}
                <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mt-3 mb-1" />

                {/* Title Bar */}
                <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-zinc-100">
                        댓글 <span className="text-emerald-400 font-semibold text-[14px] ml-1">{comments.length}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white p-1 rounded-full transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Comment List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2" />
                            댓글 불러오는 중...
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                            <p className="text-[15px]">아직 댓글이 없습니다.</p>
                            <p className="text-[13px] text-zinc-600 mt-1">첫 댓글을 작성해보세요!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.replyNo} className="flex gap-3 text-[14px] group">
                                <UserAvatar
                                    profileImagePath={comment.replyUserProfileImagePath}
                                    nickName={comment.replyUserNickNm}
                                    userId={comment.replyUserId}
                                    size={36}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-zinc-200 text-[13.5px]">
                                                @{comment.replyUserNickNm || comment.replyUserId}
                                            </span>
                                            <span className="text-[11px] text-zinc-500">
                                                {formatDate(comment.insDtime)}
                                            </span>
                                        </div>
                                        {currentUserId === comment.replyUserId && (
                                            <button
                                                onClick={() => handleDelete(comment.replyNo)}
                                                className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                                                title="삭제"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-zinc-300 mt-1 leading-relaxed break-words whitespace-pre-wrap text-[14px]">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Form */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center gap-2 pb-[calc(16px+var(--safe-bottom))]"
                >
                    <input
                        type="text"
                        value={inputContent}
                        onChange={(e) => setInputContent(e.target.value)}
                        placeholder={currentUserId ? "댓글 추가..." : "로그인이 필요합니다"}
                        disabled={!currentUserId || isSubmitting}
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-full px-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!inputContent.trim() || !currentUserId || isSubmitting}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            inputContent.trim() && currentUserId && !isSubmitting
                                ? 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        <FaPaperPlane size={14} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SnsCommentModal;
