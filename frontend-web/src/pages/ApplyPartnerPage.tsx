import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const ApplyPartnerPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [bizRegNo, setBizRegNo] = useState('');       // 표시용 (XXX-XX-XXXXX 형식)
    const [bizRegNoRaw, setBizRegNoRaw] = useState(''); // 저장용 (숫자 10자리)
    const [bizNm, setBizNm] = useState('');
    const [bizMasterNm, setBizMasterNm] = useState('');
    const [bizTelNo, setBizTelNo] = useState('');
    const [bizHpNo, setBizHpNo] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);

    const showModal = (msg: string, callback?: () => void) => {
        setModalMessage(msg);
        setModalCallback(() => callback || null);
        setModalOpen(true);
    };

    // 사업자등록번호 입력 핸들러: 숫자만 허용, XXX-XX-XXXXX 포맷 자동 적용
    const handleBizRegNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        setBizRegNoRaw(digits);

        // 포맷 변환: 3-2-5
        let formatted = digits;
        if (digits.length > 5) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        } else if (digits.length > 3) {
            formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
        }
        setBizRegNo(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            showModal("로그인이 필요한 서비스입니다.", () => navigate('/'));
            return;
        }

        if (!bizRegNoRaw || !bizNm || !bizMasterNm) {
            showModal('필수 정보를 모두 입력해주세요.');
            return;
        }

        if (bizRegNoRaw.length !== 10) {
            showModal('사업자등록번호는 숫자 10자리를 입력해주세요.');
            return;
        }

        try {
            const res = await fetch('/api/partner/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    bizRegNo: bizRegNoRaw,   // 숫자만 저장
                    bizNm,
                    bizMasterNm,
                    bizTelNo,
                    bizHpNo
                })
            });

            if (res.ok) {
                showModal("입점 신청이 정상적으로 완료되었습니다.\n관리자 승인 후 이용 가능합니다.", () => {
                    navigate('/main/profile');
                });
            } else {
                showModal("입점 신청 도중 오류가 발생했습니다. 다시 시도해 주세요.");
            }
        } catch (error) {
            console.error("Apply partner error:", error);
            showModal("서버와의 통신에 실패했습니다.");
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
                    <h1 className="text-[14px] font-bold text-[#003C48]">합주실 입점 신청</h1>
                </div>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-md mx-auto w-full">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-6 text-center">
                        <span className="text-3xl">🏬</span>
                        <h2 className="text-lg font-bold text-[#003C48] mt-2">합주실 파트너 등록</h2>
                        <p className="text-gray-400 text-xs mt-1">사업자 정보를 입력하여 입점 신청을 해주세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">사업자명(상호) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={bizNm}
                                onChange={(e) => setBizNm(e.target.value)}
                                placeholder="예: 밴디 합주실"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">사업자 등록번호 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={bizRegNo}
                                onChange={handleBizRegNoChange}
                                placeholder="예: 123-45-67890"
                                maxLength={12}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                                required
                            />
                            {bizRegNoRaw.length > 0 && bizRegNoRaw.length < 10 && (
                                <p className="text-[11px] text-red-400 mt-1 pl-1">{10 - bizRegNoRaw.length}자리 더 입력해주세요.</p>
                            )}
                            {bizRegNoRaw.length === 10 && (
                                <p className="text-[11px] text-green-500 mt-1 pl-1">✓ 입력 완료</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">대표자명 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={bizMasterNm}
                                onChange={(e) => setBizMasterNm(e.target.value)}
                                placeholder="예: 홍길동"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                                required
                            />
                        </div>

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

                        <div>
                            <label className="block text-xs font-bold text-[#003C48] mb-1.5">휴대전화번호</label>
                            <input
                                type="tel"
                                value={bizHpNo}
                                onChange={(e) => setBizHpNo(e.target.value)}
                                placeholder="예: 010-1234-5678"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all text-gray-800"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-4 w-full bg-[#003C48] hover:bg-[#002b33] text-white py-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-98 transition-all"
                        >
                            신청하기
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

export default ApplyPartnerPage;
