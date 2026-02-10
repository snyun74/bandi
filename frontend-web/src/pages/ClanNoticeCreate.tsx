import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaPaperclip } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const ClanNoticeCreate: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const userId = localStorage.getItem('userId');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [youtubeLink, setYoutubeLink] = useState('');

    // Modal State
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

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title || !content || !startDate || !endDate) {
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '제목, 내용, 공지 기간을 모두 입력해주세요.',
                onConfirm: closeModal
            });
            return;
        }

        const formData = new FormData();
        const noticeData = {
            cnNo: Number(clanId),
            title,
            content,
            writerUserId: userId,
            pinYn: isPinned ? 'Y' : 'N',
            stdDate: startDate.replace(/-/g, ''),
            endDate: endDate.replace(/-/g, ''),
            youtubeUrl: youtubeLink
        };

        formData.append("data", new Blob([JSON.stringify(noticeData)], { type: "application/json" }));
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await fetch(`/api/clans/${clanId}/notices`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: '공지가 생성되었습니다.',
                    onConfirm: () => {
                        closeModal();
                        navigate(-1);
                    }
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: '공지 생성에 실패했습니다.',
                    onConfirm: closeModal
                });
            }
        } catch (error) {
            console.error('Error creating notice:', error);
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '오류가 발생했습니다.',
                onConfirm: closeModal
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
                <h1 className="text-xl text-[#003C48] font-bold">공지 작성</h1>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-6">

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-[#003C48] font-bold text-lg">제목 <span className="text-[#FF8A80]">*</span></label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#ecf0f1] rounded-xl px-4 py-3 outline-none text-[#003C48]"
                    />
                </div>

                {/* Options: Pin & Date */}
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <label className="text-[#003C48] font-bold text-lg">공지 기간 <span className="text-[#FF8A80]">*</span></label>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="pin"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="w-5 h-5 accent-[#00BDF8]"
                            />
                            <label htmlFor="pin" className="text-[#003C48] text-sm cursor-pointer font-bold">상단 고정</label>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#003C48]"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#003C48]"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-[#003C48] font-bold text-lg">내용 <span className="text-[#FF8A80]">*</span></label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[200px] bg-[#ecf0f1] rounded-xl px-4 py-3 outline-none text-[#003C48] resize-none"
                    />
                </div>

                {/* Attachments (UI Only) */}
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-[#ecf0f1] px-4 py-3 rounded-xl text-[#003C48] font-bold text-sm min-w-fit"
                    >
                        <FaPaperclip /> {file ? file.name : "파일 업로드"}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <input
                        type="text"
                        placeholder="Youtube 링크를 입력하세요"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="flex-1 bg-[#ecf0f1] rounded-xl px-4 py-3 outline-none text-[#003C48] text-sm"
                    />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#00BDF8] text-white py-4 rounded-xl font-bold text-lg shadow-md hover:bg-[#009ce0] transition-colors"
                    >
                        공지 생성
                    </button>
                </div>
            </div>

            {/* Common Modal */}
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

export default ClanNoticeCreate;
