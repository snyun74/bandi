import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPaperclip } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const BoardWrite: React.FC = () => {
    const navigate = useNavigate();
    const { boardTypeFg } = useParams<{ boardTypeFg: string }>();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        message: "",
        onConfirm: () => { }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setModal({
                isOpen: true,
                message: "제목과 내용을 모두 입력해주세요.",
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            setModal({
                isOpen: true,
                message: "로그인이 필요한 서비스입니다.",
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const formData = new FormData();
        // Construct the JSON object for the 'data' part
        const boardData = {
            boardTypeFg: boardTypeFg || "0",
            title: title,
            content: content,
            userId: userId,
            youtubeUrl: youtubeUrl
        };

        // Append JSON data as a Blob with application/json type
        formData.append("data", new Blob([JSON.stringify(boardData)], { type: "application/json" }));

        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await fetch(`/api/boards/posts`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setModal({
                    isOpen: true,
                    message: "게시글이 작성되었습니다.",
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        navigate(-1); // Go back to list
                    }
                });
            } else {
                let errorMessage = "게시글 작성에 실패했습니다.";
                setModal({
                    isOpen: true,
                    message: errorMessage,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error("Failed to create post", error);
            setModal({
                isOpen: true,
                message: "오류가 발생했습니다.",
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const boardName = boardTypeFg === '0' ? "자유 게시판" : "초보자 게시판";

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">{boardName} 글쓰기</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {/* Title */}
                <div className="mb-4">
                    <label className="block text-[#003C48] font-bold mb-2">제목</label>
                    <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BDF8]"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Content */}
                <div className="mb-4 flex-1">
                    <label className="block text-[#003C48] font-bold mb-2">내용</label>
                    <textarea
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BDF8] min-h-[300px] resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                </div>

                {/* Attachment & Link Area */}
                <div className="flex gap-2 items-center mb-10">
                    {/* File Upload Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1 bg-gray-100 border border-gray-200 text-gray-600 px-3 py-3 rounded-xl text-sm min-w-[100px]"
                    >
                        <FaPaperclip />
                        <span className="truncate max-w-[80px]">{file ? file.name : "파일 업로드"}</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* YouTube Link Input */}
                    <input
                        type="text"
                        placeholder="Youtube 링크를 입력하세요"
                        className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BDF8]"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-[#00BDF8] text-white py-4 rounded-xl font-bold text-lg shadow-md mb-6"
                >
                    게시글 생성
                </button>
            </div>

            <CommonModal
                isOpen={modal.isOpen}
                type="alert"
                message={modal.message}
                onConfirm={modal.onConfirm}
            />
        </div>
    );
};

export default BoardWrite;
