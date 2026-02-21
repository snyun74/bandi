import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaCheck, FaTimes, FaQuestion, FaGlobe } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface AdminClanApprovalDto {
    cnNo: number;
    cnNm: string;
    cnDesc: string;
    cnUrl: string | null;
    attachNo: number | null;
    fileUrl: string | null;
    cnApprStatCd: string; // RQ:요청, RJ:거절, CN:확정
    insDtime: string;
}

const AdminClanApprovalPage: React.FC = () => {
    const navigate = useNavigate();
    const [clans, setClans] = useState<AdminClanApprovalDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

    useEffect(() => {
        fetchClans();
    }, []);

    const fetchClans = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/clans');
            if (res.ok) {
                const data = await res.json();
                setClans(data);
            } else {
                showAlert('클랜 목록을 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error(error);
            showAlert('서버와 통신 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message: string) => {
        setAlertModal({ isOpen: true, message });
    };

    const handleStatusChange = async (cnNo: number, status: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showAlert('로그인 정보가 없습니다.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('userId', userId);

            const res = await fetch(`/api/admin/clans/${cnNo}/status`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                showAlert('상태가 변경되었습니다.');
                fetchClans();
            } else {
                const text = await res.text();
                showAlert(`변경 실패: ${text}`);
            }
        } catch (error) {
            console.error(error);
            showAlert('서버와 통신 중 오류가 발생했습니다.');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString.length < 14) return dateString;
        return `${dateString.substring(0, 4)}.${dateString.substring(4, 6)}.${dateString.substring(6, 8)}`;
    };

    const isYouTubeUrl = (url: string) => {
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getYouTubeEmbedUrl = (url: string) => {
        let videoId = '';
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('watch?v=')) {
                videoId = new URL(url).searchParams.get('v') || '';
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1].split('?')[0];
            }
        } catch { }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };


    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-3">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">클랜 승인 관리</h1>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">불러오는 중...</div>
                ) : (
                    clans.map(clan => (
                        <div key={clan.cnNo} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                {/* Profile Image */}
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                    {clan.fileUrl ? (
                                        <img src={clan.fileUrl} alt={clan.cnNm} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-400 text-xs">NO IMG</div>
                                    )}
                                </div>

                                {/* Clan Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#003C48] truncate">{clan.cnNm}</h3>
                                            <p className="text-xs text-gray-400 mt-1">등록일: {formatDate(clan.insDtime)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{clan.cnDesc}</p>
                                </div>
                            </div>

                            {/* Approval Buttons */}
                            <div className="flex gap-2 mt-2 border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => handleStatusChange(clan.cnNo, 'RQ')}
                                    className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${clan.cnApprStatCd === 'RQ'
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-amber-50'
                                        }`}
                                >
                                    <FaQuestion />
                                    요청
                                </button>
                                <button
                                    onClick={() => handleStatusChange(clan.cnNo, 'RJ')}
                                    className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${clan.cnApprStatCd === 'RJ'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-red-50'
                                        }`}
                                >
                                    <FaTimes />
                                    거절
                                </button>
                                <button
                                    onClick={() => handleStatusChange(clan.cnNo, 'CN')}
                                    className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${clan.cnApprStatCd === 'CN'
                                        ? 'bg-[#00BDF8] text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-cyan-50'
                                        }`}
                                >
                                    <FaCheck />
                                    확정
                                </button>
                            </div>

                            {/* URL Preview */}
                            {clan.cnUrl && (
                                <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                    <div className="flex items-center px-3 py-2 gap-2 border-b border-gray-100">
                                        <FaGlobe className="text-blue-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-500 truncate">{clan.cnUrl}</span>
                                        <a
                                            href={clan.cnUrl.startsWith('http') ? clan.cnUrl : `http://${clan.cnUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto text-xs text-blue-500 hover:underline whitespace-nowrap"
                                        >
                                            새 탭으로 열기 ↗
                                        </a>
                                    </div>

                                    {isYouTubeUrl(clan.cnUrl) && getYouTubeEmbedUrl(clan.cnUrl) ? (
                                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                            <iframe
                                                className="absolute top-0 left-0 w-full h-full"
                                                src={getYouTubeEmbedUrl(clan.cnUrl)!}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title="YouTube Preview"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                                            <a
                                                href={clan.cnUrl.startsWith('http') ? clan.cnUrl : `http://${clan.cnUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col items-center gap-2 text-blue-500 hover:text-blue-700"
                                            >
                                                <FaGlobe size={32} />
                                                <span className="text-sm">클릭하여 사이트 방문</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
                {!loading && clans.length === 0 && (
                    <div className="text-center py-10 text-gray-500">등록된 클랜이 없습니다.</div>
                )}
            </div>

            {/* Alert Modal */}
            <CommonModal
                isOpen={alertModal.isOpen}
                type="alert"
                message={alertModal.message}
                onConfirm={() => setAlertModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default AdminClanApprovalPage;
