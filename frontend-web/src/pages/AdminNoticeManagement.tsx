import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSave, FaEdit, FaTrash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface Notice {
    noticeNo: number | null;
    title: string;
    content: string;
    writerUserId: string;
    pinYn: string;
    stdDate: string;
    endDate: string;
    insDtime?: string;
}

const AdminNoticeManagement: React.FC = () => {
    const navigate = useNavigate();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Notice>({
        noticeNo: null,
        title: '',
        content: '',
        writerUserId: '',
        pinYn: 'N',
        stdDate: '',
        endDate: ''
    });

    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await fetch('/api/admin/notices/list');
            if (res.ok) {
                const data = await res.json();
                setNotices(data);
            }
        } catch (error) {
            console.error("Failed to fetch notices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setForm({
            noticeNo: null,
            title: '',
            content: '',
            writerUserId: '',
            pinYn: 'N',
            stdDate: '',
            endDate: ''
        });
    };

    const toInputDate = (dateStr: string) => {
        if (!dateStr || dateStr.length !== 8) return '';
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    };

    const toDbDate = (dateStr: string) => {
        return dateStr.replace(/-/g, '');
    };

    const handleEdit = (notice: Notice) => {
        // 로컬(한국시간) 기준으로 날짜를 YYYYMMDD 포맷으로 변환하도록 수정
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const today = `${year}${month}${day}`;
        if (today < notice.stdDate || today > notice.endDate) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '수정 가능한 공지 기간이 아닙니다. (현재 날짜가 시작일과 종료일 사이여야 합니다)',
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        setForm({
            noticeNo: notice.noticeNo,
            title: notice.title,
            content: notice.content,
            writerUserId: notice.writerUserId,
            pinYn: notice.pinYn,
            stdDate: toInputDate(notice.stdDate),
            endDate: toInputDate(notice.endDate)
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        if (!form.title || !form.content || !form.stdDate || !form.endDate) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '모든 필수 항목(*)을 입력해 주세요.',
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const userId = localStorage.getItem('userId') || 'admin';

        const submitData = {
            ...form,
            stdDate: toDbDate(form.stdDate),
            endDate: toDbDate(form.endDate),
            pinYn: 'N' // Default to 'N' as per user request
        };

        try {
            const res = await fetch(`/api/admin/notices/save?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            if (res.ok) {
                setModal({
                    isOpen: true,
                    type: 'alert',
                    message: form.noticeNo ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.',
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        resetForm();
                        fetchNotices();
                    }
                });
            } else {
                const errorMsg = await res.text();
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: error.message || '저장 중 오류가 발생했습니다.',
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        return `${dateStr.substring(2, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']">
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-30">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <FaArrowLeft size={18} />
                </button>
                <h1 className="text-[14px] font-bold text-[#003C48] ml-2">공지사항 관리</h1>
            </div>

            <div className="p-4 flex-1 overflow-auto">
                {/* Form Section */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
                    <h2 className="text-[13px] font-bold text-[#003C48] mb-4 flex items-center gap-2">
                        {form.noticeNo ? <FaEdit className="text-[#00BDF8]" /> : <FaPlus className="text-[#00BDF8]" />}
                        {form.noticeNo ? '공지사항 수정' : '공지사항 등록'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] text-gray-500 mb-1">제목 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleInputChange}
                                placeholder="공지 제목을 입력하세요"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#00BDF8] transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">시작일자 <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="stdDate"
                                    value={form.stdDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#00BDF8] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-gray-500 mb-1">종료일자 <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#00BDF8] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] text-gray-500 mb-1">내용 <span className="text-red-500">*</span></label>
                            <textarea
                                name="content"
                                value={form.content}
                                onChange={handleInputChange}
                                placeholder="공지 내용을 입력하세요"
                                rows={4}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#00BDF8] transition-colors resize-none"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-[#00BDF8] text-white py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                            >
                                <FaSave /> {form.noticeNo ? '수정 저장' : '공지 등록'}
                            </button>
                            {form.noticeNo && (
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-[12px] font-bold active:scale-95 transition-all"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="flex flex-col">
                    <h2 className="text-[13px] font-bold text-[#003C48] mb-4">공지사항 목록</h2>

                    {loading ? (
                        <div className="py-10 text-center text-[12px] text-gray-400">불러오는 중...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-10 text-center text-[12px] text-gray-400">등록된 공지사항이 없습니다.</div>
                    ) : (
                        <div className="space-y-3 pb-10">
                            {notices.map((notice) => (
                                <div
                                    key={notice.noticeNo}
                                    onClick={() => handleEdit(notice)}
                                    className={`p-4 border rounded-2xl transition-all cursor-pointer ${notice.pinYn === 'Y' ? 'bg-[#00BDF8]/5 border-[#00BDF8]/20' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {notice.pinYn === 'Y' && (
                                                <span className="bg-[#00BDF8] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">고정</span>
                                            )}
                                            <h3 className="text-[12px] font-bold text-[#003C48] truncate max-w-[200px]">{notice.title}</h3>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{formatDate(notice.insDtime || '')}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{notice.content}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-gray-400">
                                            기간: {formatDate(notice.stdDate)} ~ {formatDate(notice.endDate)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-[#00BDF8]">
                                            <FaEdit /> <span>상세/수정</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
            />
        </div>
    );
};

export default AdminNoticeManagement;
