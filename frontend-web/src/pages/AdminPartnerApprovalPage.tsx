import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaCheck, FaTimes } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const AdminPartnerApprovalPage: React.FC = () => {
    const navigate = useNavigate();
    const adminUserId = localStorage.getItem('userId');

    const [pendingList, setPendingList] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    const showModal = (msg: string, callback?: () => void) => {
        setModalMessage(msg);
        setModalCallback(() => callback || null);
        setModalOpen(true);
    };

    const loadPendingList = async () => {
        try {
            const res = await fetch('/api/admin/partners');
            if (res.ok) {
                const data = await res.json();
                setPendingList(data);
            } else {
                showModal("신청 목록 조회에 실패했습니다.");
            }
        } catch (error) {
            console.error("Load pending partners error:", error);
            showModal("네트워크 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        loadPendingList();
    }, []);

    const handleApproveAction = async (partnerNo: number, status: 'A' | 'B') => {
        if (!adminUserId) return;
        try {
            const res = await fetch(`/api/admin/partners/${partnerNo}/status?status=${status}&userId=${adminUserId}`, {
                method: 'PUT'
            });
            if (res.ok) {
                showModal(status === 'A' ? "입점 신청이 승인되었습니다." : "입점 신청이 반려되었습니다.");
                loadPendingList();
            } else {
                showModal("처리 도중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Update partner approval error:", error);
            showModal("네트워크 오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#003C48]">합주실 입점 승인 관리</h1>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full pb-20">
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                    <h2 className="text-xs font-bold text-[#003C48] mb-4">입점 심사 대기 목록 ({pendingList.length}건)</h2>

                    {pendingList.length === 0 ? (
                        <p className="text-gray-400 text-xs text-center py-8">심사 대기 중인 입점 신청이 없습니다.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {pendingList.map((item) => (
                                <div key={item.partnerNo} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 flex flex-col gap-2.5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xs font-bold text-[#003C48]">{item.bizNm}</h3>
                                            <p className="text-[10px] text-gray-400 mt-0.5">신청자: {item.userId}</p>
                                        </div>
                                        <span className="text-[10px] bg-[#00BDF8]/10 text-[#00BDF8] px-2 py-0.5 rounded-full font-bold">심사대기</span>
                                    </div>
                                    
                                    <div className="h-[1px] bg-gray-100 my-0.5" />

                                    <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                                        <div className="flex justify-between">
                                            <span>사업자번호</span>
                                            <span className="text-gray-800 font-medium">{item.bizRegNo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>대표자명</span>
                                            <span className="text-gray-800 font-medium">{item.bizMasterNm}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>대표 전화번호</span>
                                            <span className="text-gray-800 font-medium">{item.bizTelNo || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>휴대전화번호</span>
                                            <span className="text-gray-800 font-medium">{item.bizHpNo || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>신청일시</span>
                                            <span className="text-gray-800 font-medium">
                                                {item.insDtime.substring(0,4)}-{item.insDtime.substring(4,6)}-{item.insDtime.substring(6,8)} &nbsp;
                                                {item.insDtime.substring(8,10)}:{item.insDtime.substring(10,12)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleApproveAction(item.partnerNo, 'A')}
                                            className="flex-1 bg-[#003C48] hover:bg-[#002b33] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                                        >
                                            <FaCheck size={10}/>
                                            <span>승인</span>
                                        </button>
                                        <button
                                            onClick={() => handleApproveAction(item.partnerNo, 'B')}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-[#FF6B6B] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-red-100"
                                        >
                                            <FaTimes size={10}/>
                                            <span>반려</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CommonModal
                isOpen={modalOpen}
                type="alert"
                message={modalMessage}
                onConfirm={() => {
                    setModalOpen(false);
                    if (modalCallback) {
                        modalCallback();
                        setModalCallback(null);
                    }
                }}
            />
        </div>
    );
};

export default AdminPartnerApprovalPage;
