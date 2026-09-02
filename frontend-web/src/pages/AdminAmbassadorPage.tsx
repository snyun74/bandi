import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaMedal, FaSearch, FaCheck, FaTimes,
    FaExternalLinkAlt, FaYoutube, FaLink, FaPhoneAlt, FaUser,
    FaClock, FaExclamationTriangle, FaFilter, FaBook
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import { AdminAmbassadorCourseDelegateModal } from '../components/admin/AdminAmbassadorCourseDelegateModal';

interface AdminAmbassadorItem {
    userId: string;
    userNm: string;
    userNickNm: string;
    phoneNo?: string;
    activityField: string;
    activityFieldNm: string;
    introContent: string;
    portfolioUrl?: string;
    snsUrl?: string;
    attachNo?: number | null;
    applyStatCd: 'R' | 'A' | 'J';
    rejectReason?: string;
    reviewDtime?: string;
    reviewId?: string;
    insDtime: string;
    updDtime?: string;
}

const AdminAmbassadorPage: React.FC = () => {
    const navigate = useNavigate();
    const adminUserId = localStorage.getItem('userId') || '';

    const [ambassadors, setAmbassadors] = useState<AdminAmbassadorItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filterStat, setFilterStat] = useState<'ALL' | 'R' | 'A' | 'J'>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Reject Modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [rejectReason, setRejectReason] = useState<string>('');

    // Delegate Course Modal state
    const [isDelegateModalOpen, setIsDelegateModalOpen] = useState<boolean>(false);
    const [selectedAmbassadorForDelegate, setSelectedAmbassadorForDelegate] = useState<AdminAmbassadorItem | null>(null);

    // Common Alert/Confirm Modal
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title?: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: ''
    });

    useEffect(() => {
        loadAmbassadors();
    }, []);

    const loadAmbassadors = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ambassadors');
            if (res.ok) {
                const data = await res.json();
                setAmbassadors(data);
            }
        } catch (err) {
            console.error('Failed to load admin ambassadors:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (targetUserId: string, userNm: string) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title: '엠버서더 승인',
            message: `'${userNm || targetUserId}' 회원을 엠버서더로 승인하시겠습니까?\n승인 시 교육과정 및 강의 개설 권한이 부여됩니다.`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/ambassadors/${targetUserId}/status?status=A&userId=${adminUserId}`, {
                        method: 'PUT'
                    });
                    if (res.ok) {
                        setModal({
                            isOpen: true,
                            type: 'alert',
                            title: '승인 완료',
                            message: '엠버서더 승인이 완료되었습니다.'
                        });
                        loadAmbassadors();
                    } else {
                        setModal({
                            isOpen: true,
                            type: 'alert',
                            message: '승인 처리에 실패했습니다.'
                        });
                    }
                } catch (err) {
                    setModal({
                        isOpen: true,
                        type: 'alert',
                        message: '통신 오류가 발생했습니다.'
                    });
                }
            }
        });
    };

    const handleOpenReject = (targetUserId: string) => {
        setSelectedUserId(targetUserId);
        setRejectReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedUserId) return;
        if (!rejectReason.trim()) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '반려/거절 사유를 입력해 주세요.'
            });
            return;
        }

        try {
            const res = await fetch(`/api/admin/ambassadors/${selectedUserId}/status?status=J&rejectReason=${encodeURIComponent(rejectReason.trim())}&userId=${adminUserId}`, {
                method: 'PUT'
            });

            if (res.ok) {
                setIsRejectModalOpen(false);
                setModal({
                    isOpen: true,
                    type: 'alert',
                    title: '거절 처리 완료',
                    message: '엠버서더 신청이 반려되었습니다.'
                });
                loadAmbassadors();
            } else {
                setModal({
                    isOpen: true,
                    type: 'alert',
                    message: '거절 처리에 실패했습니다.'
                });
            }
        } catch (err) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '통신 오류가 발생했습니다.'
            });
        }
    };

    const handleOpenDelegateModal = (ambassador: AdminAmbassadorItem) => {
        setSelectedAmbassadorForDelegate(ambassador);
        setIsDelegateModalOpen(true);
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '-';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        return phone;
    };

    const formatDateTime = (dtime?: string) => {
        if (!dtime || dtime.length < 12) return '-';
        return `${dtime.substring(0, 4)}-${dtime.substring(4, 6)}-${dtime.substring(6, 8)} ${dtime.substring(8, 10)}:${dtime.substring(10, 12)}`;
    };

    // Filter by status and search
    const filteredAmbassadors = ambassadors.filter((item) => {
        if (filterStat !== 'ALL' && item.applyStatCd !== filterStat) {
            return false;
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchName = (item.userNm || '').toLowerCase().includes(term);
            const matchNick = (item.userNickNm || '').toLowerCase().includes(term);
            const matchId = (item.userId || '').toLowerCase().includes(term);
            const matchField = (item.activityFieldNm || '').toLowerCase().includes(term);
            return matchName || matchNick || matchId || matchField;
        }
        return true;
    });

    const pendingCount = ambassadors.filter(a => a.applyStatCd === 'R').length;
    const approvedCount = ambassadors.filter(a => a.applyStatCd === 'A').length;
    const rejectedCount = ambassadors.filter(a => a.applyStatCd === 'J').length;

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/main/admin')}
                        className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <h1 className="text-[16px] font-extrabold text-[#003C48] flex items-center gap-1.5">
                        <FaMedal className="text-amber-500" size={17} />
                        엠버서더 승인 및 심사 관리
                    </h1>
                </div>
            </div>

            {/* Sub Header / Filters */}
            <div className="shrink-0 bg-white px-4 py-2.5 border-b border-gray-100 space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="이름, 닉네임, 아이디, 활동분야 검색"
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <button
                        onClick={() => setFilterStat('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            filterStat === 'ALL'
                                ? 'bg-[#003C48] text-white shadow-xs'
                                : 'bg-gray-50 text-gray-500 border border-gray-200/80 hover:bg-gray-100'
                        }`}
                    >
                        전체 ({ambassadors.length})
                    </button>
                    <button
                        onClick={() => setFilterStat('R')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                            filterStat === 'R'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        심사대기 ({pendingCount})
                    </button>
                    <button
                        onClick={() => setFilterStat('A')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            filterStat === 'A'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                        }`}
                    >
                        승인완료 ({approvedCount})
                    </button>
                    <button
                        onClick={() => setFilterStat('J')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            filterStat === 'J'
                                ? 'bg-red-500 text-white shadow-xs'
                                : 'bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100'
                        }`}
                    >
                        거절/반려 ({rejectedCount})
                    </button>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
                {loading ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400">엠버서더 신청 목록을 불러오는 중입니다...</p>
                    </div>
                ) : filteredAmbassadors.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-1">
                        <p className="text-xs text-gray-400 font-medium">해당 조건의 엠버서더 신청 내역이 없습니다.</p>
                        <p className="text-[10px] text-gray-400">거절된 건은 최근 1개월 이내 내역만 표시됩니다.</p>
                    </div>
                ) : (
                    filteredAmbassadors.map((item) => {
                        const isPending = item.applyStatCd === 'R';
                        const isApproved = item.applyStatCd === 'A';
                        const isRejected = item.applyStatCd === 'J';

                        return (
                            <div
                                key={item.userId}
                                className={`bg-white rounded-3xl p-4.5 border transition-all shadow-sm flex flex-col gap-3 ${
                                    isPending
                                        ? 'border-amber-300 bg-amber-50/20 shadow-amber-500/5'
                                        : isApproved
                                        ? 'border-emerald-100 hover:border-emerald-200'
                                        : 'border-gray-200 bg-gray-50/60 opacity-90'
                                }`}
                            >
                                {/* Header Row */}
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-[#003C48] font-extrabold text-xs shrink-0">
                                            {item.userNm ? item.userNm.substring(0, 1) : item.userId.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-xs font-bold text-[#003C48]">
                                                    {item.userNm || item.userId}
                                                </h3>
                                                {item.userNickNm && (
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        ({item.userNickNm})
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 block font-mono">
                                                ID: {item.userId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                                            isPending
                                                ? 'bg-amber-100 text-amber-700 animate-pulse border border-amber-300/50'
                                                : isApproved
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-red-100 text-red-600 border border-red-200'
                                        }`}
                                    >
                                        {isPending ? '● 심사 대기' : isApproved ? '승인 완료' : '반려/거절'}
                                    </span>
                                </div>

                                <div className="h-[1px] bg-gray-100" />

                                {/* Detailed Auditing Info */}
                                <div className="space-y-2 text-[11px]">
                                    {/* Activity Field & Phone */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-400 text-[10px]">활동분야:</span>
                                            <span className="px-2.5 py-0.5 bg-[#00BDF8]/10 text-[#003C48] font-bold rounded-lg text-[11px]">
                                                {item.activityFieldNm}
                                            </span>
                                        </div>
                                        {item.phoneNo && (
                                            <span className="text-gray-600 font-mono text-[11px] flex items-center gap-1">
                                                <FaPhoneAlt className="text-gray-400" size={9} />
                                                {formatPhone(item.phoneNo)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Intro Content */}
                                    <div className="bg-gray-50/90 rounded-2xl p-3 border border-gray-100 space-y-1">
                                        <span className="text-[10px] font-bold text-gray-500 block">
                                            자기소개 및 활동계획
                                        </span>
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {item.introContent}
                                        </p>
                                    </div>

                                    {/* External Links */}
                                    {(item.portfolioUrl || item.snsUrl) && (
                                        <div className="flex flex-wrap gap-2 pt-0.5">
                                            {item.portfolioUrl && (
                                                <a
                                                    href={item.portfolioUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold hover:bg-blue-100 flex items-center gap-1 transition-colors truncate max-w-[200px]"
                                                >
                                                    <FaLink size={10} /> 포트폴리오 <FaExternalLinkAlt size={8} />
                                                </a>
                                            )}
                                            {item.snsUrl && (
                                                <a
                                                    href={item.snsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-100 flex items-center gap-1 transition-colors truncate max-w-[200px]"
                                                >
                                                    <FaYoutube size={10} /> SNS/채널 <FaExternalLinkAlt size={8} />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Rejection reason display if rejected */}
                                    {isRejected && item.rejectReason && (
                                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] border border-red-100 flex items-start gap-1.5">
                                            <FaExclamationTriangle className="shrink-0 mt-0.5" size={12} />
                                            <div>
                                                <strong>거절 사유:</strong> {item.rejectReason}
                                            </div>
                                        </div>
                                    )}

                                    {/* Date & Reviewer Timestamps */}
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                                        <span>신청: {formatDateTime(item.insDtime)}</span>
                                        {item.reviewDtime && (
                                            <span>
                                                심사: {formatDateTime(item.reviewDtime)} {item.reviewId ? `(${item.reviewId})` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1 border-t border-gray-100">
                                    {/* 엠버서더 교육자료 대리 등록/관리 버튼 (승인된 엠버서더) */}
                                    {isApproved && (
                                        <button
                                            onClick={() => handleOpenDelegateModal(item)}
                                            className="w-full py-2.5 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-[#006075] border border-cyan-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
                                        >
                                            <FaBook className="text-[#00BDF8]" size={13} />
                                            <span>교육자료(강의) 대리 등록 및 관리</span>
                                        </button>
                                    )}

                                    <div className="flex gap-2">
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(item.userId, item.userNm)}
                                                    className="flex-1 py-2.5 bg-[#003C48] text-white rounded-xl text-xs font-bold hover:bg-[#002830] transition-all shadow-sm flex items-center justify-center gap-1"
                                                >
                                                    <FaCheck size={11} /> 승인 처리
                                                </button>
                                                <button
                                                    onClick={() => handleOpenReject(item.userId)}
                                                    className="flex-1 py-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <FaTimes size={11} /> 거절 / 반려
                                                </button>
                                            </>
                                        )}

                                        {isApproved && (
                                            <button
                                                onClick={() => handleOpenReject(item.userId)}
                                                className="w-full py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-1"
                                            >
                                                <FaTimes size={11} /> 승인 취소 (반려 처리)
                                            </button>
                                        )}

                                        {isRejected && (
                                            <button
                                                onClick={() => handleApprove(item.userId, item.userNm)}
                                                className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1"
                                            >
                                                <FaCheck size={11} /> 재심사 승인
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3.5 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-sm font-bold text-[#003C48] flex items-center gap-1.5">
                            <FaExclamationTriangle className="text-red-500" /> 엠버서더 신청 반려
                        </h3>
                        <p className="text-[11px] text-gray-500">
                            신청자에게 표시될 반려 사유를 상세히 입력해 주세요.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="예: 제출하신 포트폴리오 링크 접근이 불가능합니다. 확인 후 재신청 바랍니다."
                            rows={4}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:border-red-400 focus:bg-white leading-relaxed"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleRejectSubmit}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-sm"
                            >
                                반려 확정
                            </button>
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delegate Ambassador Course Management Modal */}
            <AdminAmbassadorCourseDelegateModal
                isOpen={isDelegateModalOpen}
                onClose={() => setIsDelegateModalOpen(false)}
                targetAmbassador={selectedAmbassadorForDelegate}
            />

            {/* Common Alert / Confirm Modal */}
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={() => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    if (modal.onConfirm) modal.onConfirm();
                }}
            />
        </div>
    );
};

export default AdminAmbassadorPage;
