import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaRegCommentDots, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const UserAvatar: React.FC<{ userId: string; size?: string }> = ({ userId, size = 'w-8 h-8' }) => {
    const [img, setImg] = React.useState<string | null | undefined>(undefined);
    React.useEffect(() => {
        fetch(`/api/user/profile/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setImg(d?.profileImageUrl || null))
            .catch(() => setImg(null));
    }, [userId]);
    if (img === undefined) return <div className={`${size} bg-gray-200 rounded-full flex-shrink-0`} />;
    if (img) return <img src={img} alt="" className={`${size} rounded-full flex-shrink-0 object-cover`} />;
    return <div className={`${size} bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white`}>👤</div>;
};

interface Comment {
    replyNo: number;
    boardNo: number;
    content: string;
    replyUserId: string;
    userNickNm: string;
    regDate: string;
    likeCnt?: number;
    isLiked?: boolean;
    parentReplyNo?: number | null;
    depth?: number;
    childReplyCount?: number;
}

interface PostDetail {
    boardNo: number;
    boardTypeFg: string;
    title: string;
    content: string;
    writerUserId: string;
    userNickNm: string;
    regDate: string;
    likeCnt: number;
    isLiked: boolean;
    scrapCnt: number;
    isScrapped: boolean;
    youtubeUrl?: string; // Optional
    attachFilePath?: string; // Optional
}

const BoardDetail: React.FC = () => {
    const navigate = useNavigate();
    const { boardNo } = useParams<{ boardNo: string }>();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyInput, setReplyInput] = useState("");
    const [commentInput, setCommentInput] = useState("");

    // Scrap Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const userId = localStorage.getItem('userId');
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (boardNo) {
            fetchPostDetail();
            fetchComments();
        }
    }, [boardNo]);

    const fetchPostDetail = async () => {
        try {
            const safeUserId = userId || "";
            const res = await fetch(`/api/boards/posts/${boardNo}?userId=${safeUserId}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                console.error("Fetch failed");
                alert("게시글을 불러오지 못했습니다.");
                navigate(-1);
            }
        } catch (e) {
            console.error("Failed to fetch post", e);
            alert("오류가 발생했습니다.");
            navigate(-1);
        }
    };

    const fetchComments = async () => {
        try {
            const safeUserId = userId || "";
            const res = await fetch(`/api/boards/posts/${boardNo}/comments?userId=${safeUserId}&_=${new Date().getTime()}`);
            if (res.ok) {
                const data = await res.json();
                setComments(Array.isArray(data) ? data : []);
            } else {
                console.error(`Failed to fetch comments. Status: ${res.status}`);
            }
        } catch (e) {
            console.error("Failed to fetch comments", e);
        }
    };

    const handleReplyClick = (comment: Comment) => {
        if (comment.parentReplyNo) {
            alert("답글에는 답글을 달 수 없습니다.");
            return;
        }
        if (replyingTo === comment.replyNo) {
            setReplyingTo(null);
            setReplyInput("");
        } else {
            setReplyingTo(comment.replyNo);
            setReplyInput("");
        }
    };

    const handleSubmitReply = async (parentReplyNo: number) => {
        if (!replyInput.trim() || !userId || !boardNo) return;

        try {
            const res = await fetch(`/api/boards/posts/${boardNo}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content: replyInput, parentReplyNo })
            });

            if (res.ok) {
                setReplyingTo(null);
                setReplyInput("");
                fetchComments();
                // fetchPostDetail(); 
            }
        } catch (e) {
            console.error("Failed to submit reply", e);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentInput.trim() || !userId || !boardNo) return;

        try {
            const res = await fetch(`/api/boards/posts/${boardNo}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content: commentInput })
            });

            if (res.ok) {
                setCommentInput("");
                fetchComments();
                // fetchPostDetail(); 
            }
        } catch (e) {
            console.error("Failed to submit comment", e);
        }
    };

    const handleLike = async () => {
        if (!userId || !boardNo) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const res = await fetch(`/api/boards/posts/${boardNo}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                fetchPostDetail(); // Refresh to get updated count
            }
        } catch (e) {
            console.error("Failed to like post", e);
        }
    };

    const handleScrap = async () => {
        if (!userId || !boardNo) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const res = await fetch(`/api/boards/posts/${boardNo}/scrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                const wasScrapped = post?.isScrapped;
                setModalMessage(wasScrapped ? "보관이 취소되었습니다." : "보관했습니다.");
                setIsModalOpen(true);
                fetchPostDetail(); // Refresh to get updated count
            }
        } catch (e) {
            console.error("Failed to scrap post", e);
        }
    };

    const handleCommentLike = async (replyNo: number) => {
        if (!userId) {
            alert("로그인이 필요합니다.");
            return;
        }
        try {
            const res = await fetch(`/api/boards/comments/${replyNo}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                await fetchComments();
            }
        } catch (e) {
            console.error("Failed to like comment", e);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 12) return dateStr;
        // Format: YYYY.MM.DD AM/PM HH:MM:SS
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        const hStr = dateStr.substring(8, 10);
        const min = dateStr.substring(10, 12);
        const sec = dateStr.length >= 14 ? dateStr.substring(12, 14) : '00';

        let h = parseInt(hStr);
        const ampm = h >= 12 ? '오후' : '오전';
        h = h % 12;
        if (h === 0) h = 12;

        return `${y}.${m}.${d} ${ampm} ${String(h).padStart(2, '0')}:${min}:${sec}`;
    };

    const getEmbedUrl = (url: string) => {
        let videoId = "";
        if (url.includes("youtube.com/watch?v=")) {
            videoId = url.split("v=")[1];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1];
        } else if (url.includes("youtube.com/embed/")) {
            return url;
        }

        if (videoId) {
            const ampersandPosition = videoId.indexOf('&');
            if (ampersandPosition !== -1) {
                videoId = videoId.substring(0, ampersandPosition);
            }
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    };

    if (!post) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    const boardName = post.boardTypeFg === "0" ? "자유 게시판" : "초보자 게시판";

    return (
        <div className="flex flex-col bg-white font-['Jua'] min-h-full" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">{boardName}</h1>
            </div>

            <div className="flex-1 pb-[130px]">
                {/* Post Content */}
                <div className="p-5 bg-[#F9FAFB] m-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-[#003C48] mb-4">{post.title}</h2>

                    <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                        <div className="mr-2 flex-shrink-0">
                            <UserAvatar userId={post.writerUserId} size="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-800">{post.userNickNm || "익명"}</div>
                            <div className="text-xs text-gray-500">{formatDate(post.regDate)}</div>
                        </div>
                    </div>

                    <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line mb-6 min-h-[100px]">
                        {post.content}
                    </div>

                    {/* Attached Image */}
                    {post.attachFilePath && (
                        <div className="mb-6">
                            <img
                                src={post.attachFilePath}
                                alt="첨부 이미지"
                                className="max-w-full h-auto rounded-lg"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* YouTube Video */}
                    {post.youtubeUrl && (
                        <div className="mb-6 aspect-video">
                            <iframe
                                src={getEmbedUrl(post.youtubeUrl)}
                                title="YouTube video player"
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 text-gray-400 text-sm">
                        <div className={`flex items-center gap-1 cursor-pointer ${post.isLiked ? 'text-red-500' : 'text-[#00BDF8]'}`} onClick={handleLike}>
                            <FaRegThumbsUp /> <span>({post.likeCnt})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaRegCommentDots /> <span>({comments.length})</span>
                        </div>
                        <div className={`flex items-center gap-1 cursor-pointer ${post.isScrapped ? 'text-gray-800' : 'text-gray-400'}`} onClick={handleScrap}>
                            {post.isScrapped ? <FaBookmark className="text-[#0E3B46]" /> : <FaRegBookmark />} <span>({post.scrapCnt || 0})</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="px-4">
                    <h3 className="text-[#003C48] font-bold text-lg mb-4">댓글</h3>

                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm py-4">댓글이 없습니다. 첫 댓글을 남겨보세요!</div>
                        ) : (() => {
                            // Organize comments: Roots then Children
                            const roots = comments.filter(c => !c.parentReplyNo);
                            const children = comments.filter(c => c.parentReplyNo);
                            const organizedComments: Comment[] = [];

                            roots.forEach(root => {
                                organizedComments.push(root);
                                const myChildren = children.filter(c => c.parentReplyNo === root.replyNo);
                                // Assuming children are already sorted by date from backend
                                organizedComments.push(...myChildren);
                            });

                            return organizedComments.map((comment) => (
                                <div key={comment.replyNo} className={`border-b border-gray-100 pb-4 last:border-0 ${comment.parentReplyNo ? 'ml-10 bg-gray-50 p-3 rounded-lg' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex gap-2 w-full">
                                            {/* Comment User Icon */}
                                            <div className="flex-shrink-0">
                                                <UserAvatar userId={comment.replyUserId} size="w-8 h-8" />
                                            </div>
                                            <div className="w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm ${comment.replyUserId === post.writerUserId ? 'text-[#00BDF8]' : 'text-gray-800'}`}>
                                                        {comment.userNickNm || "익명"}
                                                        {comment.replyUserId === post.writerUserId && " (작성자)"}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400">{formatDate(comment.regDate)}</div>
                                                <p className="text-gray-800 text-sm mt-1 break-all whitespace-pre-wrap">{comment.content}</p>

                                                {/* Reply Input Form */}
                                                {replyingTo === comment.replyNo && (
                                                    <div className="mt-3 flex items-end gap-2">
                                                        <textarea
                                                            ref={replyTextareaRef}
                                                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8] resize-none overflow-hidden"
                                                            placeholder="답글을 입력하세요..."
                                                            value={replyInput}
                                                            onChange={(e) => setReplyInput(e.target.value)}
                                                            autoFocus
                                                            rows={1}
                                                            style={{ minHeight: '38px', maxHeight: '100px' }}
                                                        />
                                                        <button
                                                            onClick={() => handleSubmitReply(comment.replyNo)}
                                                            className="bg-[#00BDF8] text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap mb-0.5"
                                                        >
                                                            등록
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-1 flex-shrink-0">
                                            {/* Reply Button (Only for root comments) */}
                                            {!comment.parentReplyNo && (
                                                <button
                                                    onClick={() => handleReplyClick(comment)}
                                                    className="flex items-center gap-1 text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full hover:bg-gray-200"
                                                >
                                                    <FaRegCommentDots />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleCommentLike(comment.replyNo)}
                                                className={`flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors ${comment.isLiked ? 'text-red-500' : 'text-[#00BDF8]'}`}
                                            >
                                                <FaRegThumbsUp /> <span>({comment.likeCnt || 0})</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* Main Input Footer */}
            <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-3 z-[60]">
                <div className="relative bg-[#F3F4F6] rounded-xl flex items-end p-2 gap-2">
                    <textarea
                        ref={commentTextareaRef}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-1 py-1 text-gray-700 placeholder-gray-400 resize-none overflow-hidden"
                        placeholder="따뜻한 댓글을 남겨주세요."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        rows={1}
                        style={{ minHeight: '24px', maxHeight: '100px' }}
                    />
                    <button
                        onClick={handleSubmitComment}
                        className="bg-[#00BDF8] text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap mb-0.5"
                    >
                        전송
                    </button>
                </div>
            </div>

            <CommonModal
                isOpen={isModalOpen}
                type="alert"
                message={modalMessage}
                onConfirm={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default BoardDetail;
