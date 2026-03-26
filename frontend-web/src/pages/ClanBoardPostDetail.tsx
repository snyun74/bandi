import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaRegThumbsUp, FaRegCommentDots, FaRegBookmark, FaBookmark, FaEdit, FaImage, FaTimes } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import SectionTitle from '../components/common/SectionTitle';

const UserAvatar: React.FC<{ userId: string; size?: string; isAnonymous?: boolean }> = ({ userId, size = 'w-8 h-8', isAnonymous = false }) => {
    const [img, setImg] = React.useState<string | null | undefined>(undefined);
    React.useEffect(() => {
        if (isAnonymous) {
            setImg(null);
            return;
        }
        fetch(`/api/user/profile/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setImg(d?.profileImageUrl || null))
            .catch(() => setImg(null));
    }, [userId, isAnonymous]);
    if (img === undefined) return <div className={`${size} bg-gray-200 rounded-full flex-shrink-0`} />;
    if (img) return <img src={img} alt="" className={`${size} rounded-full flex-shrink-0 object-cover`} />;
    return (
        <div className={`${size} bg-gray-100 rounded-full flex-shrink-0 overflow-hidden border border-gray-100`}>
            <img src="/images/default_profile.png" alt="" className="w-full h-full object-cover opacity-60" />
        </div>
    );
};

interface Comment {
    cnReplyNo: number;
    cnBoardNo: number;
    content: string;
    writerUserId: string;
    userNickNm: string;
    regDate: string;
    likeCnt?: number;
    parentReplyNo: number | null;
    depth?: number;
    childReplyCount?: number;
    likeCount?: number;
    maskingYn?: string;
}


interface PostDetail {
    cnBoardNo: number;
    boardTypeNm?: string;
    title: string;
    content: string;
    writerUserId: string;
    userNickNm: string;
    regDate: string;
    youtubeUrl?: string;
    likeCnt: number;
    replyCnt: number;
    scrapCnt: number;
    isScrapped: boolean;
    attachFilePath?: string;
    maskingYn?: string;
}

const ClanBoardPostDetail: React.FC = () => {
    const navigate = useNavigate();
    const { clanId, boardTypeNo, boardNo } = useParams<{ clanId: string; boardTypeNo: string; boardNo: string }>();
    const [post, setPost] = useState<PostDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyInput, setReplyInput] = useState("");
    const [isReplyAnonymous, setIsReplyAnonymous] = useState(false);

    const [commentInput, setCommentInput] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const userId = localStorage.getItem('userId');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [onModalConfirm, setOnModalConfirm] = useState<(() => void) | null>(null);

    // Delete confirm modal
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [clanRole, setClanRole] = useState<string>('NONE'); // 현재 유저의 클랜 역할

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (boardNo) {
            fetchPostDetail();
            fetchComments();
        }
        if (clanId && userId) {
            fetch(`/api/clans/${clanId}/members/${userId}/role`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data && typeof data === 'string') {
                        setClanRole(data);
                    } else if (data && data.role) {
                        setClanRole(data.role);
                    }
                })
                .catch(() => setClanRole('NONE'));
        }
    }, [boardNo, clanId, userId]);

    // Auto-resize comment textarea
    useEffect(() => {
        if (commentTextareaRef.current) {
            commentTextareaRef.current.style.height = 'auto';
            commentTextareaRef.current.style.height = `${Math.min(commentTextareaRef.current.scrollHeight, 100)}px`;
        }
    }, [commentInput]);

    // Auto-resize reply textarea
    useEffect(() => {
        if (replyTextareaRef.current) {
            replyTextareaRef.current.style.height = 'auto';
            replyTextareaRef.current.style.height = `${Math.min(replyTextareaRef.current.scrollHeight, 100)}px`;
        }
    }, [replyInput]);

    const fetchPostDetail = async () => {
        try {
            const safeUserId = userId || "";
            const res = await fetch(`/api/clans/boards/posts/${boardNo}?userId=${safeUserId}`);
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
            const res = await fetch(`/api/clans/boards/posts/${boardNo}/comments?_=${new Date().getTime()}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Comments data:", data);
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
        if (replyingTo === comment.cnReplyNo) {
            setReplyingTo(null);
            setReplyInput("");
        } else {
            setReplyingTo(comment.cnReplyNo);
            setReplyInput("");
        }
    };

    const handleSubmitReply = async (parentReplyNo: number) => {
        if (!replyInput.trim() || !userId || !boardNo) return;

        try {
            const res = await fetch(`/api/clans/boards/posts/${boardNo}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content: replyInput, parentReplyNo, maskingYn: isReplyAnonymous ? 'Y' : 'N' })
            });

            if (res.ok) {
                setReplyingTo(null);
                setReplyInput("");
                setIsReplyAnonymous(false);
                fetchComments();
                fetchPostDetail();
            }
        } catch (e) {
            console.error("Failed to submit reply", e);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentInput.trim() || !userId || !boardNo) return;

        try {
            const res = await fetch(`/api/clans/boards/posts/${boardNo}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content: commentInput, maskingYn: isAnonymous ? 'Y' : 'N' })
            });

            if (res.ok) {
                setCommentInput("");
                setIsAnonymous(false);
                fetchComments();
                fetchPostDetail(); // Refresh reply count
            }
        } catch (e) {
            console.error("Failed to submit comment", e);
        }
    };

    const handleLike = async () => {
        if (!userId || !boardNo) return;
        try {
            const res = await fetch(`/api/clans/boards/posts/${boardNo}/like`, {
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
            const res = await fetch(`/api/clans/boards/posts/${boardNo}/scrap`, {
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
        console.log(`Liking comment ${replyNo} by user ${userId}`);
        try {
            const res = await fetch(`/api/clans/boards/comments/${replyNo}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                console.log("Like request successful, refreshing comments...");
                // Refresh comments to update like count
                await fetchComments();
            } else {
                // Optional: Show message if already liked, or just ignore
                console.log("Like failed or already liked");
            }
        } catch (e) {
            console.error("Failed to like comment", e);
        }
    };

    // 삭제 권한: 작성자이거나 클랜장(01) / 간부(02)
    const canDelete = post &&
        userId &&
        (post.writerUserId === userId || clanRole === '01' || clanRole === '02');

    const handleDeletePost = async () => {
        if (!userId || !boardNo || !clanId) {
            setModalMessage('필수 정보가 누락되었습니다. (Login/Board/Clan)');
            setOnModalConfirm(null);
            setIsModalOpen(true);
            return;
        }
        try {
            const res = await fetch(`/api/clans/${clanId}/boards/posts/${boardNo}/delete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (res.ok) {
                setIsDeleteConfirmOpen(false);
                setModalMessage(data.message || '게시글이 삭제되었습니다.');
                setOnModalConfirm(() => () => {
                    navigate(`/main/clan/board/${clanId}`);
                });
                setIsModalOpen(true);
            } else {
                setModalMessage(data.message || '삭제에 실패했습니다.');
                setOnModalConfirm(null);
                setIsModalOpen(true);
            }
        } catch (e) {
            console.error('Failed to delete post', e);
            setModalMessage('오류가 발생했습니다.');
            setOnModalConfirm(null);
            setIsModalOpen(true);
        }
    };

    const handleEditClick = () => {
        if (!post) return;
        setEditTitle(post.title);
        setEditContent(post.content);
        setEditYoutubeUrl(post.youtubeUrl || "");
        setEditFile(null);
        setEditFilePreview(post.attachFilePath || null);
        setIsEditModalOpen(true);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditFile(file);
            setEditFilePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdatePost = async () => {
        if (!editTitle.trim() || !editContent.trim()) {
            setModalMessage("제목과 내용을 입력해주세요.");
            setIsModalOpen(true);
            return;
        }

        const formData = new FormData();
        const data = {
            cnNo: clanId,
            cnBoardTypeNo: boardTypeNo,
            title: editTitle,
            content: editContent,
            userId: userId,
            youtubeUrl: editYoutubeUrl,
            maskingYn: post?.maskingYn || 'N',
            deleteFile: !editFilePreview && !!post?.attachFilePath
        };

        formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
        if (editFile) {
            formData.append("file", editFile);
        }

        try {
            const res = await fetch(`/api/clans/boards/posts/${boardNo}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                setIsEditModalOpen(false);
                setModalMessage("게시글이 수정되었습니다.");
                setIsModalOpen(true);
                fetchPostDetail();
            } else {
                const errData = await res.json();
                setModalMessage(errData.message || "수정에 실패했습니다.");
                setIsModalOpen(true);
            }
        } catch (e) {
            console.error("Failed to update post", e);
            setModalMessage("오류가 발생했습니다.");
            setIsModalOpen(true);
        }
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

    const formatDate = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 12) return dateStr;
        // Format: YYYY.MM.DD AM/PM HH:MM:SS (Approximation)
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

    if (!post) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="flex flex-col bg-white font-['Pretendard'] min-h-full" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="top-room-detail-title">{post.boardTypeNm || '클랜 게시판'}</h1>
            </div>

            <div className="flex-1 pb-[130px]">
                <div className="p-5 bg-[#F9FAFB] m-4 rounded-xl shadow-sm border border-gray-100">
                    <SectionTitle className="!mt-0 mb-4">{post.title}</SectionTitle>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                                <UserAvatar userId={post.writerUserId} size="w-8 h-8" isAnonymous={post.maskingYn === 'Y'} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-800">{post.userNickNm}</div>
                                <div className="text-xs text-gray-500">{formatDate(post.regDate)}</div>
                            </div>
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
                        {userId === post.writerUserId && (
                            <div className="flex items-center gap-1 cursor-pointer text-gray-500" onClick={handleEditClick}>
                                <FaEdit /> <span>수정</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 cursor-pointer text-[#00BDF8]" onClick={handleLike}>
                            <FaRegThumbsUp /> <span>({post.likeCnt})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FaRegCommentDots /> <span>({post.replyCnt})</span>
                        </div>
                        <div className={`flex items-center gap-1 cursor-pointer ${post.isScrapped ? 'text-gray-800' : 'text-gray-400'}`} onClick={handleScrap}>
                            {post.isScrapped ? <FaBookmark className="text-[#0E3B46]" /> : <FaRegBookmark />} <span>({post.scrapCnt || 0})</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="px-4">
                    <SectionTitle className="!mt-0 mb-4">댓글</SectionTitle>

                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <div key={comment.cnReplyNo} className={`border-b border-gray-100 pb-4 last:border-0 ${comment.parentReplyNo ? 'ml-10 bg-gray-50 p-3 rounded-lg' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex gap-2 w-full">
                                        {/* Comment User Icon */}
                                        <div className="flex-shrink-0">
                                            <UserAvatar userId={comment.writerUserId} size="w-8 h-8" isAnonymous={comment.maskingYn === 'Y'} />
                                        </div>
                                        <div className="w-full">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${comment.writerUserId === post.writerUserId && comment.maskingYn !== 'Y' ? 'text-[#00BDF8]' : 'text-gray-800'}`}>
                                                    {comment.userNickNm}
                                                    {comment.writerUserId === post.writerUserId && comment.maskingYn !== 'Y' && " (작성자)"}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400">{formatDate(comment.regDate)}</div>
                                            <p className="text-gray-800 text-sm mt-1 break-all whitespace-pre-wrap">{comment.content}</p>

                                            {/* Reply Input Form */}
                                            {replyingTo === comment.cnReplyNo && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer select-none" onClick={() => setIsReplyAnonymous(!isReplyAnonymous)}>
                                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isReplyAnonymous ? 'bg-[#00BDF8] border-[#00BDF8]' : 'bg-white border-gray-300'}`}>
                                                                {isReplyAnonymous && <div className="w-1 h-1 bg-white rounded-full"></div>}
                                                            </div>
                                                            <span className="text-[9px] text-gray-500 mt-0.5 font-medium">익명</span>
                                                        </div>
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
                                                            onClick={() => handleSubmitReply(comment.cnReplyNo)}
                                                            className="bg-[#00BDF8] text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap mb-0.5"
                                                        >
                                                            등록
                                                        </button>
                                                    </div>
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
                                                <FaRegCommentDots /> <span>({comment.childReplyCount || 0})</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCommentLike(comment.cnReplyNo)}
                                            className="flex items-center gap-1 text-[#00BDF8] text-xs bg-blue-50 px-2 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors"
                                        >
                                            <FaRegThumbsUp /> <span>({comment.likeCount || 0})</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Input Footer */}
            <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-3 z-[60]">
                <div className="relative bg-[#F3F4F6] rounded-xl flex items-center p-2 gap-2">
                    <div className="flex flex-col items-center ml-1 flex-shrink-0 cursor-pointer select-none" onClick={() => setIsAnonymous(!isAnonymous)}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isAnonymous ? 'bg-[#00BDF8] border-[#00BDF8]' : 'bg-white border-gray-300'}`}>
                            {isAnonymous && <div className="w-1 h-1 bg-white rounded-full"></div>}
                        </div>
                        <span className="text-[9px] text-gray-500 mt-0.5 font-medium leading-none">익명</span>
                    </div>
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
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-800">게시글 수정</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00BDF8] focus:border-transparent transition-all text-[13px]"
                                    placeholder="제목을 입력하세요"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">내용</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 h-48 focus:outline-none focus:ring-2 focus:ring-[#00BDF8] focus:border-transparent transition-all resize-none text-[13px]"
                                    placeholder="내용을 입력하세요"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">유튜브 URL (선택)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00BDF8] focus:border-transparent transition-all text-[13px]"
                                    placeholder="https://www.youtube.com/..."
                                    value={editYoutubeUrl}
                                    onChange={(e) => setEditYoutubeUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">이미지 첨부 (선택)</label>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 text-gray-500 hover:border-[#00BDF8] hover:text-[#00BDF8] hover:bg-blue-50 transition-all"
                                    >
                                        <FaImage />
                                        <span className="text-sm font-medium">이미지 변경하기</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleEditFileChange}
                                    />
                                    {editFilePreview && (
                                        <div className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm inline-block">
                                            <img src={editFilePreview} alt="Preview" className="max-w-full h-40 object-cover" />
                                            <button 
                                                onClick={() => {
                                                    setEditFile(null);
                                                    setEditFilePreview(null);
                                                }}
                                                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-all"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUpdatePost}
                                className="flex-1 py-3.5 bg-[#00BDF8] text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-[#00aee5] transition-all"
                            >
                                수정완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClanBoardPostDetail;
// End of component
