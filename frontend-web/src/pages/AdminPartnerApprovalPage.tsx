import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaCheck, FaTimes, FaStore, FaSearch,
    FaCreditCard, FaUndoAlt
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import { formatAccountNumber } from '../utils/bankUtils';

interface PartnerItem {
    partnerNo: number;
    userId: string;
    bizNm: string;
    bizRegNo: string;
    bizMasterNm: string;
    bizTelNo?: string;
    bizHpNo?: string;
    bizAddr?: string;
    bizAddrDtl?: string;
    partnerStatCd: 'R' | 'A' | 'B';
    bankNm?: string;
    accountNo?: string;
    accountHolderNm?: string;
    insDtime: string;
    updDtime?: string;
}

const AdminPartnerApprovalPage: React.FC = () => {
    const navigate = useNavigate();
    const adminUserId = localStorage.getItem('userId') || '';

    const [partnerList, setPartnerList] = useState<PartnerItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filterStat, setFilterStat] = useState<'R' | 'A' | 'B'>('R');
    const [searchTerm, setSearchTerm] = useState<string>('');

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

    const loadPartners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/partners');
            if (res.ok) {
                const data = await res.json();
                setPartnerList(data || []);
            } else {
                showAlert('입점사 목록 조회에 실패했습니다.');
            }
        } catch (error) {
            console.error('Load partners error:', error);
            showAlert('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPartners();
    }, []);

    const handleApproveAction = (partnerNo: number, bizNm: string, status: 'A' | 'B') => {
        if (!adminUserId) return;

        const isApprove = status === 'A';
        const msg = isApprove
            ? `'${bizNm}' 업체의 입점 신청을 승인하시겠습니까?\n승인 시 합주실 지점 및 룸 등록이 가능해집니다.`
            : `'${bizNm}' 업체의 입점 신청을 반려(거절)하시겠습니까?`;

        showConfirm(msg, async () => {
            try {
                const res = await fetch(`/api/admin/partners/${partnerNo}/status?status=${status}&userId=${adminUserId}`, {
                    method: 'PUT'
                });
                if (res.ok) {
                    showAlert(isApprove ? '입점 신청이 승인되었습니다.' : '입점 신청이 반려되었습니다.');
                    loadPartners();
                } else {
                    showAlert('처리 도중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Update partner approval error:', error);
                showAlert('네트워크 오류가 발생했습니다.');
            }
        });
    };

    const showAlert = (message: string, onConfirm?: () => void) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm
        });
    };

    const showConfirm = (message: string, onConfirm: () => void) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            message,
            onConfirm
        });
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

    // Filter & Search
    const filteredPartners = partnerList.filter((item) => {
        if (item.partnerStatCd !== filterStat) {
            return false;
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchBiz = (item.bizNm || '').toLowerCase().includes(term);
            const matchReg = (item.bizRegNo || '').toLowerCase().includes(term);
            const matchMaster = (item.bizMasterNm || '').toLowerCase().includes(term);
            const matchUser = (item.userId || '').toLowerCase().includes(term);
            return matchBiz || matchReg || matchMaster || matchUser;
        }
        return true;
    });

    const pendingCount = partnerList.filter(p => p.partnerStatCd === 'R').length;
    const approvedCount = partnerList.filter(p => p.partnerStatCd === 'A').length;
    const rejectedCount = partnerList.filter(p => p.partnerStatCd === 'B').length;

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate('/main/admin')}
                            className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <FaChevronLeft size={18} />
                        </button>
                        <h1 className="text-[16px] font-extrabold text-[#003C48] flex items-center gap-1.5">
                            <FaStore className="text-[#00BDF8]" size={16} />
                            합주실 입점 승인 및 입주사 관리
                        </h1>
                    </div>
                </div>
            </div>

            {/* Sub Header / Summary & Filters */}
            <div className="shrink-0 bg-white px-4 py-2.5 border-b border-gray-100 space-y-2.5 shadow-xs">
                <div className="max-w-4xl mx-auto w-full space-y-2.5">
                    {/* Search Bar */}
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="업체명, 대표자명, 사업자번호, 아이디 검색"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* 3 Tabs: 심사대기 / 승인완료 / 승인거절 */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setFilterStat('R')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                filterStat === 'R'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50/50 hover:border-amber-200'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${filterStat === 'R' ? 'bg-white' : 'bg-amber-400'} animate-pulse`} />
                            심사대기 ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilterStat('A')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                filterStat === 'A'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50/50 hover:border-emerald-200'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${filterStat === 'A' ? 'bg-white' : 'bg-emerald-500'}`} />
                            승인완료 ({approvedCount})
                        </button>
                        <button
                            onClick={() => setFilterStat('B')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                filterStat === 'B'
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50/50 hover:border-rose-200'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${filterStat === 'B' ? 'bg-white' : 'bg-rose-400'}`} />
                            승인거절 ({rejectedCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
                <div className="max-w-4xl mx-auto w-full space-y-3.5">
                    {loading ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-400 animate-pulse">입점사 목록을 불러오는 중입니다...</p>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm space-y-1.5">
                            <span className="text-3xl block mb-2">
                                {filterStat === 'R' ? '📋' : filterStat === 'A' ? '🏢' : '📂'}
                            </span>
                            <p className="text-xs text-gray-500 font-bold">
                                {filterStat === 'R'
                                    ? '현재 심사 대기 중인 입점 신청이 없습니다.'
                                    : filterStat === 'A'
                                    ? '승인 완료된 입점사가 없습니다.'
                                    : '승인 거절된 입점사 내역이 없습니다.'}
                            </p>
                            {searchTerm && (
                                <p className="text-[11px] text-gray-400">검색어 조건을 확인해 보세요.</p>
                            )}
                        </div>
                    ) : (
                        filteredPartners.map((item) => {
                            const isPending = item.partnerStatCd === 'R';
                            const isApproved = item.partnerStatCd === 'A';
                            const isRejected = item.partnerStatCd === 'B';

                            return (
                                <div
                                    key={item.partnerNo}
                                    className={`bg-white rounded-3xl p-4.5 border transition-all shadow-sm flex flex-col gap-3 ${
                                        isPending
                                            ? 'border-amber-300 bg-amber-50/20 shadow-amber-500/5'
                                            : isApproved
                                            ? 'border-emerald-100 hover:border-emerald-200'
                                            : 'border-rose-100 bg-rose-50/10'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                                                isPending
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : isApproved
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                🏢
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-[#003C48]">
                                                    {item.bizNm}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                                    사업자번호: {item.bizRegNo} · ID: {item.userId}
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
                                                    : 'bg-rose-100 text-rose-700 border border-rose-200'
                                            }`}
                                        >
                                            {isPending ? '● 심사 대기' : isApproved ? '● 승인 완료' : '● 승인 거절'}
                                        </span>
                                    </div>

                                    <div className="h-[1px] bg-gray-100" />

                                    {/* Detailed Partner Info */}
                                    <div className="space-y-1.5 text-[11px] text-gray-600">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">대표자명</span>
                                            <span className="font-semibold text-gray-800">{item.bizMasterNm}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-400">대표 전화번호</span>
                                            <span className="font-medium text-gray-700">{formatPhone(item.bizTelNo)}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-gray-400">담당자 휴대폰</span>
                                            <span className="font-medium text-gray-700">{formatPhone(item.bizHpNo)}</span>
                                        </div>

                                        {(item.bizAddr || item.bizAddrDtl) && (
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-gray-400 shrink-0">사업장 주소</span>
                                                <span className="font-medium text-gray-700 text-right leading-tight">
                                                    {item.bizAddr} {item.bizAddrDtl}
                                                </span>
                                            </div>
                                        )}

                                        {/* Bank Account Info Box */}
                                        {(item.bankNm || item.accountNo || item.accountHolderNm) && (
                                            <div className="mt-1 pt-2 pb-1.5 px-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold text-[#003C48]">
                                                    <span className="flex items-center gap-1">
                                                        <FaCreditCard className="text-[#00BDF8]" size={10} /> 입금/정산 계좌
                                                    </span>
                                                    <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-bold">
                                                        {item.bankNm || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-gray-400 text-[10px]">계좌번호</span>
                                                    <span className="font-mono font-bold text-gray-800 tracking-wider">
                                                        {formatAccountNumber(item.bankNm || '', item.accountNo || '')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-gray-400 text-[10px]">예금주명</span>
                                                    <span className="font-medium text-gray-700">{item.accountHolderNm || '-'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timestamps */}
                                        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1.5 border-t border-gray-100">
                                            <span>신청일시: {formatDateTime(item.insDtime)}</span>
                                            {item.updDtime && item.updDtime !== item.insDtime && (
                                                <span>처리/갱신: {formatDateTime(item.updDtime)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleApproveAction(item.partnerNo, item.bizNm, 'A')}
                                                    className="flex-1 py-2.5 bg-[#003C48] text-white rounded-xl text-xs font-bold hover:bg-[#002830] transition-all shadow-sm flex items-center justify-center gap-1.5"
                                                >
                                                    <FaCheck size={11} /> 승인 처리
                                                </button>
                                                <button
                                                    onClick={() => handleApproveAction(item.partnerNo, item.bizNm, 'B')}
                                                    className="flex-1 py-2.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <FaTimes size={11} /> 반려 / 거절
                                                </button>
                                            </>
                                        )}

                                        {isApproved && (
                                            <button
                                                onClick={() => handleApproveAction(item.partnerNo, item.bizNm, 'B')}
                                                className="w-full py-2.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <FaTimes size={11} /> 승인 취소 (반려 처리)
                                            </button>
                                        )}

                                        {isRejected && (
                                            <button
                                                onClick={() => handleApproveAction(item.partnerNo, item.bizNm, 'A')}
                                                className="w-full py-2.5 bg-[#003C48] text-white rounded-xl text-xs font-bold hover:bg-[#002830] transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            >
                                                <FaUndoAlt size={11} /> 다시 승인 처리
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

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

export default AdminPartnerApprovalPage;
