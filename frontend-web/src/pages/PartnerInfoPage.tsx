import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaLock } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import BankAccountInputGroup from '../components/common/BankAccountInputGroup';

const PartnerInfoPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [partnerNo, setPartnerNo] = useState<number | null>(null);
    const [bizRegNo, setBizRegNo] = useState('');
    const [bizNm, setBizNm] = useState('');
    const [bizMasterNm, setBizMasterNm] = useState('');
    const [bizTelNo, setBizTelNo] = useState('');
    const [bizHpNo, setBizHpNo] = useState('');

    // 입금/정산 계좌 정보
    const [bankNm, setBankNm] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [accountHolderNm, setAccountHolderNm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    const showModal = (msg: string, callback?: () => void) => {
        setModalMessage(msg);
        setModalCallback(() => callback || null);
        setModalOpen(true);
    };

    // 사업자등록번호 포맷팅 (XXX-XX-XXXXX)
    const formatBizRegNo = (raw: string) => {
        if (!raw) return '';
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 10) {
            return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        }
        return digits;
    };

    // 휴대전화번호 입력 핸들러: 숫자만 허용, 010-XXXX-XXXX 포맷 자동 적용
    const handleBizHpNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
        let formatted = digits;
        if (digits.length > 7) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        } else if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        }
        setBizHpNo(formatted);
    };

    useEffect(() => {
        if (!userId) {
            showModal("로그인이 필요한 서비스입니다.", () => navigate('/'));
            return;
        }

        const fetchPartnerInfo = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/partner/status?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.partnerNo) {
                        setPartnerNo(data.partnerNo);
                        setBizRegNo(data.bizRegNo || '');
                        setBizNm(data.bizNm || '');
                        setBizMasterNm(data.bizMasterNm || '');
                        setBizTelNo(data.bizTelNo || '');
                        setBizHpNo(data.bizHpNo || '');
                        setBankNm(data.bankNm || '');
                        setAccountNo(data.accountNo || '');
                        setAccountHolderNm(data.accountHolderNm || '');
                    } else {
                        showModal("입점 파트너 정보를 찾을 수 없습니다.", () => navigate('/main/profile'));
                    }
                } else {
                    showModal("파트너 정보 조회에 실패했습니다.", () => navigate('/main/profile'));
                }
            } catch (error) {
                console.error("Fetch partner info error:", error);
                showModal("네트워크 통신 오류가 발생했습니다.", () => navigate('/main/profile'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchPartnerInfo();
    }, [userId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId || !partnerNo) {
            showModal("유효하지 않은 요청입니다.");
            return;
        }

        if (!bizMasterNm.trim()) {
            showModal("대표자명을 입력해주세요.");
            return;
        }

        if (!bizHpNo.trim()) {
            showModal("휴대전화번호를 입력해주세요.");
            return;
        }

        const cleanHp = bizHpNo.replace(/\D/g, '');
        if (cleanHp.length < 10 || cleanHp.length > 11) {
            showModal("휴대전화번호는 10~11자리 숫자로 올바르게 입력해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/partner/info?userId=${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerNo,
                    bizMasterNm,
                    bizTelNo,
                    bizHpNo,
                    bankNm,
                    accountNo,
                    accountHolderNm
                })
            });

            if (res.ok) {
                showModal("입점사 정보가 성공적으로 수정되었습니다.", () => {
                    navigate('/main/profile');
                });
            } else {
                const errMsg = await res.text();
                showModal(errMsg || "정보 수정 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Update partner info error:", error);
            showModal("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full bg-[#F8F9FA]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003C48]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={20} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#003C48]">입점사 정보 관리</h1>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-md mx-auto w-full pb-20">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-6 text-center">
                        <span className="text-3xl">🏢</span>
                        <h2 className="text-lg font-bold text-[#003C48] mt-2">입점사 정보 확인 및 수정</h2>
                        <p className="text-gray-400 text-xs mt-1">
                            사업자 정보 및 정산 계좌 정보를 최신 상태로 유지하세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* 사업자명 (수정 불가) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-[#003C48]">사업자명(상호)</label>
                                <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    <FaLock size={10} /> 수정 불가
                                </span>
                            </div>
                            <input
                                type="text"
                                value={bizNm}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 font-medium cursor-not-allowed select-none"
                            />
                        </div>

                        {/* 사업자등록번호 (수정 불가) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-[#003C48]">사업자 등록번호</label>
                                <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    <FaLock size={10} /> 수정 불가
                                </span>
                            </div>
                            <input
                                type="text"
                                value={formatBizRegNo(bizRegNo)}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 font-medium cursor-not-allowed select-none"
                            />
                        </div>

                        <div className="h-[1px] bg-gray-100 my-1"></div>

                        {/* 대표자명 (수정 가능) */}
                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">
                                대표자명 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={bizMasterNm}
                                onChange={(e) => setBizMasterNm(e.target.value)}
                                placeholder="예: 홍길동"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                                required
                            />
                        </div>

                        {/* 대표 전화번호 (수정 가능) */}
                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">대표 전화번호</label>
                            <input
                                type="tel"
                                value={bizTelNo}
                                onChange={(e) => setBizTelNo(e.target.value)}
                                placeholder="예: 02-123-4567"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                            />
                        </div>

                        {/* 휴대전화번호 (수정 가능) */}
                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">
                                휴대전화번호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={bizHpNo}
                                onChange={handleBizHpNoChange}
                                placeholder="예: 010-1234-5678"
                                maxLength={13}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                                required
                            />
                        </div>

                        {/* 입금 / 정산 계좌 정보 (재사용 컴포넌트) */}
                        <BankAccountInputGroup
                            bankNm={bankNm}
                            accountNo={accountNo}
                            accountHolderNm={accountHolderNm}
                            onChangeBankNm={setBankNm}
                            onChangeAccountNo={setAccountNo}
                            onChangeAccountHolderNm={setAccountHolderNm}
                            required={false}
                            title="입금 / 정산 계좌 정보"
                            description="정산금 입금 및 계좌 확인을 위한 은행 및 계좌번호를 입력해주세요."
                        />

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="mt-4 w-full bg-[#003C48] hover:bg-[#002b33] text-white py-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-98 transition-all disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '수정 내용 저장'}
                        </button>
                    </form>
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

export default PartnerInfoPage;
