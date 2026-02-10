import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPaperPlane } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface NoticeDetail {
    cnNoticeNo: number;
    title: string;
    content: string;
    insDtime: string;
    writerUserId: string;
    attachFilePath?: string;
    youtubeUrl?: string;
}

interface CommentItem {
    cnCommentNo: number;
    commentUserId: string;
    userNickNm?: string;
    content: string;
    insDtime: string;
    parentCommentNo: number;
}

const ClanNoticeDetail: React.FC = () => {
    const navigate = useNavigate();
    const { clanId, noticeId } = useParams<{ clanId: string; noticeId: string }>();
    const userId = localStorage.getItem('userId');

    const [notice, setNotice] = useState<NoticeDetail | null>(null);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyComment, setReplyComment] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Modal Config
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const fetchNotice = async () => {
        try {
            const res = await fetch(`/api/clans/${clanId}/notices/${noticeId}`);
            if (res.ok) {
                const data = await res.json();
                setNotice(data);
            }
        } catch (error) {
            console.error("Failed to fetch notice", error);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/clans/${clanId}/notices/${noticeId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    };

    useEffect(() => {
        if (clanId && noticeId) {
            fetchNotice();
            fetchComments();
        }
    }, [clanId, noticeId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [newComment]);

    // Auto-resize reply textarea
    useEffect(() => {
        if (replyTextareaRef.current) {
            replyTextareaRef.current.style.height = 'auto';
            replyTextareaRef.current.style.height = `${Math.min(replyTextareaRef.current.scrollHeight, 100)}px`;
        }
    }, [replyComment]);

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length !== 14) return dateStr;
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        const h = dateStr.substring(8, 10);
        const min = dateStr.substring(10, 12);
        const s = dateStr.substring(12, 14);
        return `${y}.${m}.${d} ${h}:${min}:${s}`;
    };

    const handleAddComment = async (parentId = 0) => {
        if (!newComment.trim()) return;
        await submitComment(newComment, parentId);
        setNewComment('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleAddReply = async (parentId: number) => {
        if (!replyComment.trim()) return;
        await submitComment(replyComment, parentId);
        setReplyComment('');
        setReplyTo(null);
    };

    const submitComment = async (content: string, parentId: number) => {
        try {
            const res = await fetch(`/api/clans/${clanId}/notices/${noticeId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnNoticeNo: Number(noticeId),
                    commentUserId: userId,
                    content: content,
                    parentCommentNo: parentId
                })
            });

            if (res.ok) {
                fetchComments();
            } else {
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: '댓글 등록 실패',
                    onConfirm: closeModal
                });
            }
        } catch (error) {
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '오류 발생',
                onConfirm: closeModal
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return;
        // Removed Enter key submission logic
    };

    const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, parentId: number) => {
        if (e.nativeEvent.isComposing) return;
        // Removed Enter key submission logic
    };

    if (!notice) return <div className="text-center py-10">Loading...</div>;

    const renderComments = () => {
        // Group comments by parent
        // Sort root comments by insDtime DESC (Latest first)
        const rootComments = comments
            .filter(c => c.parentCommentNo === 0)
            .sort((a, b) => b.insDtime.localeCompare(a.insDtime));

        const replyMap = new Map<number, CommentItem[]>();

        comments.forEach(c => {
            if (c.parentCommentNo !== 0) {
                if (!replyMap.has(c.parentCommentNo)) {
                    replyMap.set(c.parentCommentNo, []);
                }
                replyMap.get(c.parentCommentNo)?.push(c);
            }
        });

        // Flatten the list with replies immediately after parents
        const threadedComments: CommentItem[] = [];
        rootComments.forEach(root => {
            threadedComments.push(root);
            if (replyMap.has(root.cnCommentNo)) {
                threadedComments.push(...(replyMap.get(root.cnCommentNo) || []));
            }
        });

        return threadedComments.map((comment) => (
            <div key={comment.cnCommentNo}>
                <div
                    className={`flex gap-3 ${comment.parentCommentNo > 0 ? 'ml-10 mt-2' : ''}`}
                >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {comment.commentUserId.substring(0, 1)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[#003C48] font-bold text-xs">{comment.userNickNm || comment.commentUserId}</span>
                            <span className="text-gray-400 text-[10px]">{formatDate(comment.insDtime)}</span>
                        </div>
                        <div
                            className="text-[#003C48] text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors whitespace-pre-wrap"
                            onClick={() => setReplyTo(replyTo === comment.cnCommentNo ? null : comment.cnCommentNo)}
                        >
                            {comment.content}
                        </div>
                    </div>
                </div>
                {/* Inline Reply Input */}
                {replyTo === comment.cnCommentNo && (
                    <div className={`mt-2 ${comment.parentCommentNo > 0 ? 'ml-10' : 'ml-10'}`}>
                        <div className="flex items-end gap-2 bg-white border border-[#00BDF8] rounded-[20px] px-4 py-2 shadow-sm">
                            <textarea
                                ref={replyTextareaRef}
                                className="flex-1 outline-none text-sm text-[#003C48] placeholder-gray-400 bg-transparent resize-none overflow-hidden"
                                placeholder="답글을 입력하세요..."
                                autoFocus
                                value={replyComment}
                                onChange={(e) => setReplyComment(e.target.value)}
                                onKeyDown={(e) => handleReplyKeyDown(e, comment.parentCommentNo > 0 ? comment.parentCommentNo : comment.cnCommentNo)}
                                rows={1}
                                style={{ minHeight: '24px', maxHeight: '100px' }}
                            />
                            <button
                                onClick={() => handleAddReply(comment.parentCommentNo > 0 ? comment.parentCommentNo : comment.cnCommentNo)}
                                className={`p-2 rounded-full transition-colors mb-0.5 ${replyComment.trim() ? 'text-[#00BDF8]' : 'text-gray-300'}`}
                                disabled={!replyComment.trim()}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1];
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1];
            const ampersandPosition = videoId.indexOf('&');
            if (ampersandPosition !== -1) {
                videoId = videoId.substring(0, ampersandPosition);
            }
        } else if (url.includes('youtube.com/embed/')) {
            return url;
        }
        return `https://www.youtube.com/embed/${videoId}`;
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">공지 현황</h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {/* Notice Content */}
                <div className="px-6 mb-6">
                    <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-[#003C48] text-xl font-bold mb-2">{notice.title}</h2>
                    </div>
                    <div className="text-[#003C48] whitespace-pre-wrap min-h-[150px] text-sm leading-relaxed mb-6">
                        {notice.content}
                    </div>

                    {/* Attached Image */}
                    {notice.attachFilePath && (
                        <div className="mb-6">
                            <img
                                src={notice.attachFilePath}
                                alt="첨부 이미지"
                                className="max-w-full h-auto rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* YouTube Video */}
                    {notice.youtubeUrl && (
                        <div className="mb-6 aspect-video">
                            <iframe
                                src={getEmbedUrl(notice.youtubeUrl)}
                                title="YouTube video player"
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <div className="bg-gray-50 p-6 min-h-[200px]">
                    <h3 className="text-[#003C48] font-bold mb-4 text-sm">댓글 {comments.length}</h3>

                    {/* Comment Input (Top) */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-[20px] px-4 py-2 shadow-sm">
                            <textarea
                                ref={textareaRef}
                                className="flex-1 outline-none text-sm text-[#003C48] placeholder-gray-400 bg-transparent resize-none overflow-hidden"
                                placeholder="댓글을 입력하세요..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                style={{ minHeight: '24px', maxHeight: '100px' }}
                            />
                            <button
                                onClick={() => handleAddComment(0)}
                                className={`p-2 rounded-full transition-colors mb-0.5 ${newComment.trim() ? 'text-[#00BDF8]' : 'text-gray-300'}`}
                                disabled={!newComment.trim()}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {comments.length > 0 ? renderComments() : (
                            <div className="text-center text-gray-400 text-xs py-4">
                                첫 번째 댓글을 남겨주세요!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default ClanNoticeDetail;
