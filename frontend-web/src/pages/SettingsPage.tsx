import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaChevronLeft, 
    FaChevronRight, 
    FaShieldAlt, 
    FaFileContract, 
    FaStore, 
    FaUserTimes,
    FaTimes,
    FaBuilding
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

type PolicyType = 'PRIVACY' | 'TERMS' | 'PARTNER' | null;

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
    const [activePolicy, setActivePolicy] = useState<PolicyType>(null);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchPartnerStatus = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`/api/partner/status?userId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setPartnerStatus(data ? data.partnerStatCd : null);
                }
            } catch {
                setPartnerStatus(null);
            }
        };
        fetchPartnerStatus();
    }, [userId]);

    const showAlert = (message: string, callback?: () => void) => {
        setAlertMessage(message);
        setAlertCallback(() => callback || null);
        setIsAlertModalOpen(true);
    };

    const handleWithdrawConfirm = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`/api/user/withdraw/${userId}`, {
                method: 'PUT'
            });
            if (response.ok) {
                setIsWithdrawModalOpen(false);
                showAlert("회원 탈퇴가 완료되었습니다.", () => {
                    localStorage.clear();
                    navigate('/');
                });
            } else {
                showAlert("회원 탈퇴에 실패했습니다.");
            }
        } catch (error) {
            console.error("Account withdraw error:", error);
            showAlert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-['Pretendard']">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
                <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95 cursor-pointer"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <h1 className="text-[17px] font-bold text-[#003C48] absolute left-1/2 -translate-x-1/2">
                        설정
                    </h1>
                    <div className="w-8" />
                </div>
            </div>

            <div className="max-w-screen-md mx-auto px-4 py-5 space-y-6">
                {/* 약관 및 정책 섹션 */}
                <div>
                    <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                        약관 및 정책
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden divide-y divide-gray-100">
                        {/* 1. 개인정보처리방침 */}
                        <button
                            onClick={() => setActivePolicy('PRIVACY')}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00BDF8] flex items-center justify-center shrink-0">
                                    <FaShieldAlt size={16} />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-gray-800 group-hover:text-[#003C48] transition-colors">
                                        개인정보처리방침
                                    </div>
                                    <div className="text-[12px] text-gray-400 mt-0.5">
                                        개인정보 수집, 이용 및 처리 보호 정책
                                    </div>
                                </div>
                            </div>
                            <FaChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>

                        {/* 2. 이용약관 */}
                        <button
                            onClick={() => setActivePolicy('TERMS')}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <FaFileContract size={16} />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-gray-800 group-hover:text-[#003C48] transition-colors">
                                        이용약관
                                    </div>
                                    <div className="text-[12px] text-gray-400 mt-0.5">
                                        밴디콘 서비스 이용 및 게시물 운영 정책
                                    </div>
                                </div>
                            </div>
                            <FaChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>

                        {/* 3. 합주실 입점 약관 (합주실 입점 승인된 파트너 유저에게만 노출) */}
                        {partnerStatus === 'A' && (
                            <button
                                onClick={() => setActivePolicy('PARTNER')}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left group cursor-pointer bg-gradient-to-r from-amber-50/30 to-transparent"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                                        <FaStore size={16} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[15px] font-semibold text-gray-800 group-hover:text-[#003C48] transition-colors">
                                                합주실 입점 약관
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                입점 파트너
                                            </span>
                                        </div>
                                        <div className="text-[12px] text-gray-400 mt-0.5">
                                            합주실 공간 대여, 수수료 정산 및 운영 규정
                                        </div>
                                    </div>
                                </div>
                                <FaChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 계정 관리 섹션 */}
                <div>
                    <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                        계정 관리
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                        {/* 4. 회원탈퇴 */}
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50/60 active:bg-red-100/50 transition-colors text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                    <FaUserTimes size={16} />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-red-600 transition-colors">
                                        회원탈퇴
                                    </div>
                                    <div className="text-[12px] text-gray-400 mt-0.5">
                                        계정 영구 삭제 및 모든 개인 데이터 파기
                                    </div>
                                </div>
                            </div>
                            <FaChevronRight size={14} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* 서비스 안내 푸터 */}
                <div className="pt-6 pb-2 text-center text-gray-400 text-[12px] space-y-1">
                    <div className="font-semibold text-gray-500">밴디콘 (Bandicon)</div>
                    <div>버전 1.0.0 • 상호명: 밴디콘 • 대표자: 윤동규</div>
                    <div>사업자등록번호: 513-20-02706 • 문의: snyun74@gmail.com</div>
                </div>
            </div>

            {/* 약관 상세 뷰어 모달 */}
            {activePolicy && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    activePolicy === 'PRIVACY' ? 'bg-blue-100 text-[#00BDF8]' :
                                    activePolicy === 'TERMS' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                    {activePolicy === 'PRIVACY' && <FaShieldAlt size={15} />}
                                    {activePolicy === 'TERMS' && <FaFileContract size={15} />}
                                    {activePolicy === 'PARTNER' && <FaBuilding size={15} />}
                                </div>
                                <h3 className="text-[17px] font-bold text-gray-900">
                                    {activePolicy === 'PRIVACY' && '개인정보처리방침'}
                                    {activePolicy === 'TERMS' && '서비스 이용약관'}
                                    {activePolicy === 'PARTNER' && '합주실 입점 약관'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActivePolicy(null)}
                                className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Modal Body - Policy Content */}
                        <div className="p-6 overflow-y-auto space-y-6 text-gray-700 text-[14px] leading-relaxed scrollbar-thin">
                            {/* --- 1. 개인정보처리방침 내용 --- */}
                            {activePolicy === 'PRIVACY' && (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-gray-700 text-[13.5px]">
                                        밴디콘(이하 '회사')은 밴디콘 서비스 기획 및 운영에 있어 『개인정보 보호법』, 『정보통신망 이용촉진 및 정보보호 등에 관한 법률』 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
                                    </div>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제1조 (개인정보의 수집 및 이용 목적, 수집 항목)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 다음의 목적을 위해 필수 및 선택 개인정보를 수집하고 있습니다. 선택 항목은 동의하지 않더라도 서비스 이용이 가능합니다.
                                        </p>
                                        <div className="space-y-2.5 mt-2">
                                            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70">
                                                <div className="flex items-center gap-2 font-bold text-gray-800 text-[14px] mb-1">
                                                    <span className="text-[11px] px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-bold">필수</span>
                                                    수집 항목
                                                </div>
                                                <p className="text-gray-600 text-[13px]">
                                                    이름, 휴대폰 번호, 성별, 기기식별값(FCM)
                                                </p>
                                                <p className="text-gray-500 text-[12px] mt-1">
                                                    ※ 목적: 회원 가입 및 식별, 본인 인증, 서비스 제공, 푸시 알림 발송, 부정이용 방지
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70">
                                                <div className="flex items-center gap-2 font-bold text-gray-800 text-[14px] mb-1">
                                                    <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md font-bold">선택</span>
                                                    수집 항목
                                                </div>
                                                <p className="text-gray-600 text-[13px]">
                                                    생년월일, 이메일 주소
                                                </p>
                                                <p className="text-gray-500 text-[12px] mt-1">
                                                    ※ 목적: 서비스 통계 분석, 맞춤형 콘텐츠 제공, 본인 확인 보조, 이벤트 및 광고성 정보 안내
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-[12px] mt-1 italic">
                                            ※ 카카오 SNS 로그인 시, 이용자의 동의를 거쳐 회원 식별을 위한 최소한의 정보를 카카오로부터 제공받아 수집합니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제2조 (개인정보의 처리 및 보유 기간)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 원칙적으로 이용자의 회원 탈퇴 등 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래와 같이 법령에서 정한 기간 동안 보관합니다.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-[13.5px] bg-gray-50 p-3.5 rounded-xl border border-gray-200/70">
                                            <li><strong>통신비밀보호법:</strong> 로그인 기록, 접속 IP 정보 (3개월)</li>
                                            <li><strong>전자상거래 등에서의 소비자보호에 관한 법률:</strong> 소비자의 불만 또는 분쟁 처리에 관한 기록 (3년), 계약 또는 청약철회 등에 관한 기록 (5년)</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제3조 (개인정보 처리 업무의 위탁)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.
                                        </p>
                                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1 text-[13px]">
                                            <div><strong>수탁업체:</strong> (주)누리고 (CoolSMS)</div>
                                            <div><strong>위탁 업무 내용:</strong> 본인 확인을 위한 SMS 인증 번호 발송</div>
                                            <div><strong>보유 및 이용 기간:</strong> 회원 탈퇴 시 또는 위탁 계약 종료 시까지</div>
                                        </div>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제4조 (개인정보의 파기 절차 및 방법)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄하거나 소각합니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제5조 (이용자 및 법정대리인의 권리와 그 행사 방법)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-[13.5px]">
                                            <li>이용자는 회사에 대해 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.</li>
                                            <li>앱 내 '회원 탈퇴' 메뉴 또는 고객센터 이메일을 통해 즉시 계정 폐쇄 및 수집된 개인정보의 삭제를 진행할 수 있습니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제6조 (개인정보 보호책임자 및 고충 처리)
                                        </h4>
                                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 text-[13px] space-y-1">
                                            <div><strong>담당 부서 / 직책:</strong> 운영팀</div>
                                            <div><strong>이메일:</strong> snyun74@gmail.com</div>
                                        </div>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#00BDF8] rounded-full inline-block"></span>
                                            제7조 (개인정보처리방침의 변경)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            이 개인정보처리방침은 2026년 9월 1일부터 적용됩니다.
                                        </p>
                                    </section>

                                    <div className="p-4 rounded-xl bg-gray-100/70 border border-gray-200 text-gray-600 text-[12px] space-y-1 mt-4">
                                        <div className="font-bold text-gray-800 text-[13px] mb-1">[사업자 정보]</div>
                                        <div>상호명: 밴디콘 | 대표자: 윤동규</div>
                                        <div>사업자등록번호: 513-20-02706</div>
                                        <div>사업장 주소: 서울특별시 도봉구 해등로 50 301동 605호</div>
                                        <div>고객센터: snyun74@gmail.com</div>
                                    </div>
                                </div>
                            )}

                            {/* --- 2. 이용약관 내용 --- */}
                            {activePolicy === 'TERMS' && (
                                <div className="space-y-6">
                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제1조 (목적)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            본 약관은 밴디콘(이하 '회사')이 제공하는 음악 관련 플랫폼 서비스(이하 '서비스')의 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제2조 (용어의 정의)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-[13.5px] bg-gray-50 p-3.5 rounded-xl border border-gray-200/70">
                                            <li><strong>'서비스':</strong> 단말기와 상관없이 회원이 이용할 수 있는 밴디콘 및 밴디콘 관련 제반 서비스를 의미합니다.</li>
                                            <li><strong>'회원':</strong> 본 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 고객을 말합니다.</li>
                                            <li><strong>'게시물':</strong> 회원이 서비스상에 게시한 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제3조 (약관의 게시와 개정)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 화면을 통하여 게시합니다. 필요 시 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제4조 (회원의 의무 및 게시물 운영 정책)
                                        </h4>
                                        <div className="space-y-2 text-gray-600 text-[13.5px]">
                                            <p>회원은 관련 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항 등을 준수하여야 합니다.</p>
                                            <div className="p-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200/70 text-[13px]">
                                                🎵 밴디콘의 모든 게시물 및 활동은 "음악"과 관련성이 있어야 합니다.
                                            </div>
                                            <p>회사는 회원이 등록한 게시물이나 활동이 다음 각 호에 해당한다고 판단되는 경우, 사전 통지 없이 삭제하거나 임시 조치할 수 있습니다.</p>
                                            <ul className="list-decimal list-inside space-y-1 pl-1 text-[13px] text-gray-600">
                                                <li>음악과 무관한 홍보, 일상 공유, 정치/종교적 발언 등 서비스 취지에 어긋나는 경우</li>
                                                <li>타인을 비방하거나 명예를 훼손하는 내용인 경우</li>
                                                <li>공공질서 및 미풍양속에 위반되는 내용인 경우</li>
                                                <li>제3자의 저작권 등 기타 권리를 침해하는 경우</li>
                                            </ul>
                                        </div>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제5조 (계약 해지 및 이용 제한)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-[13.5px]">
                                            <li>회원은 언제든지 서비스 내 설정 메뉴를 통하여 이용계약 해지(회원 탈퇴)를 신청할 수 있습니다.</li>
                                            <li>회사는 회원이 제4조(회원의 의무 및 게시물 운영 정책)를 위반하거나, 음악과 무관한 활동을 지속적으로 반복하여 서비스의 정상적인 운영을 방해하는 경우, 경고, 일시 정지, 영구 이용 정지 등으로 서비스 이용을 제한할 수 있습니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            제6조 (책임 제한)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 천재지변 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제되며, 회원이 서비스에 게재한 정보의 신뢰도나 정확성에 관하여는 책임을 지지 않습니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                                            부칙
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            본 약관은 2026년 9월 1일부터 적용됩니다.
                                        </p>
                                    </section>

                                    <div className="p-4 rounded-xl bg-gray-100/70 border border-gray-200 text-gray-600 text-[12px] space-y-1 mt-4">
                                        <div className="font-bold text-gray-800 text-[13px] mb-1">[사업자 정보]</div>
                                        <div>상호명: 밴디콘 | 대표자: 윤동규</div>
                                        <div>사업자등록번호: 513-20-02706</div>
                                        <div>사업장 주소: 서울특별시 도봉구 해등로 50 301동 605호</div>
                                        <div>문의 이메일: snyun74@gmail.com</div>
                                    </div>
                                </div>
                            )}

                            {/* --- 3. 합주실 입점 약관 내용 --- */}
                            {activePolicy === 'PARTNER' && (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[13.5px]">
                                        본 약관은 밴디콘 플랫폼을 통해 합주실 공간 대여 서비스를 제공하는 사업자(입점회원)를 위한 전용 약관입니다.
                                    </div>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제1조 (목적)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            본 약관은 밴디콘(이하 '회사')이 제공하는 플랫폼을 통해 합주실 공간 대여 서비스를 제공하고자 하는 사업자(이하 '입점회원')와 회사 간의 제반 권리, 의무, 수수료 정산 및 책임 사항을 규정함을 목적으로 합니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제2조 (용어의 정의)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-[13.5px] bg-gray-50 p-3.5 rounded-xl border border-gray-200/70">
                                            <li><strong>'입점회원':</strong> 회사의 일반 회원으로 가입한 후, 본 약관에 동의하고 회사로부터 합주실 등록 및 판매를 승인받은 개인 또는 법인 사업자를 말합니다.</li>
                                            <li><strong>'예약회원':</strong> 회사의 플랫폼을 통해 입점회원의 합주실을 예약하고 결제하는 일반 회원을 말합니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제3조 (입점 신청 및 승인)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-[13.5px]">
                                            <li>입점을 희망하는 자는 회사가 요청하는 사업자등록증, 공간 정보, 이용 요금 등의 필수 정보를 사실대로 제공해야 합니다.</li>
                                            <li>회사는 제공된 정보를 심사한 후 입점 승인 여부를 결정하며, 허위 정보가 포함되어 있거나 서비스 취지에 부합하지 않는 경우 승인을 거절할 수 있습니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제4조 (서비스 수수료 및 정산)
                                        </h4>
                                        <div className="space-y-2.5 text-gray-600 text-[13.5px]">
                                            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                                                <p>
                                                    1. 회사는 입점회원의 합주실 예약 및 결제를 중개하는 대가로, <strong>최종 결제 금액의 10%(VAT 포함)</strong>를 서비스 수수료로 차감합니다.
                                                </p>
                                                <p className="text-[12.5px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-100">
                                                    ※ 단, 초기 입점 프로모션, 특별 이벤트 또는 회사와 입점회원 간의 별도 사전 협의가 있는 경우, 수수료를 일정 기간 면제하거나 할인된 수수료율을 적용할 수 있습니다. (단, 수수료 면제 기간에도 결제대행사(PG) 시스템 이용에 따른 기본 결제 수수료(3.74%, VAT 포함/별도)는 입점회원이 부담하며, 정산 시 차감됩니다.)
                                                </p>
                                                <p className="font-medium text-gray-800">
                                                    2. 회사는 예약회원의 합주실 이용이 정상적으로 완료된 건에 한하여, <strong>매주 일요일부터 토요일까지의 이용 완료 금액에서 수수료를 차감한 정산 대금을 차주 월요일</strong>에 입점회원이 지정한 계좌로 지급합니다.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제5조 (입점회원의 의무)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-[13.5px]">
                                            <li>입점회원은 플랫폼에 등록한 공간의 시설 상태, 이용 요금, 예약 가능 일정을 항상 최신 상태로 정확하게 유지해야 합니다.</li>
                                            <li>입점회원은 예약회원이 안전하고 쾌적하게 공간을 이용할 수 있도록 시설물 유지 보수에 만전을 기해야 합니다.</li>
                                            <li>입점회원은 회사 플랫폼 내의 가격보다 오프라인이나 타 플랫폼에서 더 저렴한 가격으로 예약을 유도하여 회사의 영업을 방해해서는 안 됩니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제6조 (취소 및 환불 규정)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            입점회원의 개인적인 사정이나 시설 문제로 인해 일방적으로 예약이 취소될 경우, 입점회원은 예약회원에게 전액 환불해야 하며 이로 인해 발생하는 회사의 손해(결제 수수료 등)를 배상해야 합니다.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제7조 (손해배상 및 면책)
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1.5 text-gray-600 text-[13.5px]">
                                            <li>회사는 통신판매중개자로서 플랫폼을 제공할 뿐, 입점회원이 등록한 공간의 품질이나 예약회원과의 실제 거래에 대해서는 원칙적으로 법적 책임을 지지 않습니다.</li>
                                            <li>예약회원이 합주실 이용 중 입점회원의 시설물(악기, 장비 등)을 파손하거나 훼손한 경우, 당사자 간의 해결을 원칙으로 하며 회사는 이에 개입하거나 손해를 배상할 책임이 없습니다.</li>
                                            <li>입점회원의 시설 결함으로 인해 예약회원에게 신체적, 재산적 피해가 발생한 경우, 그 책임은 전적으로 입점회원에게 있습니다.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            제8조 (계약 해지 및 이용 제한)
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            회사는 입점회원이 다음 각 호에 해당하는 경우, 사전 통보 후 입점 계약을 해지하거나 서비스 노출을 중단할 수 있습니다.
                                        </p>
                                        <ul className="list-decimal list-inside space-y-1 pl-1 text-[13px] text-gray-600">
                                            <li>허위 정보를 등록하거나 타인의 사업자 정보를 도용한 경우</li>
                                            <li>정당한 사유 없이 예약을 일방적으로 취소하거나 노쇼(No-show)를 방치하는 등 서비스 품질을 심각하게 저하시킨 경우</li>
                                            <li>예약회원과 잦은 분쟁을 일으키거나 본 약관의 중대한 의무를 위반한 경우</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-2">
                                        <h4 className="font-bold text-[15px] text-[#003C48] flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                                            부칙
                                        </h4>
                                        <p className="text-gray-600 text-[13.5px]">
                                            본 약관은 2026년 9월 1일부터 적용됩니다.
                                        </p>
                                    </section>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setActivePolicy(null)}
                                className="px-6 py-2.5 bg-[#003C48] text-white text-[14px] font-bold rounded-xl hover:bg-[#002B34] active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 회원 탈퇴 확인 모달 */}
            <CommonModal
                isOpen={isWithdrawModalOpen}
                type="confirm"
                variant="danger"
                message="정말 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
                onConfirm={handleWithdrawConfirm}
                onCancel={() => setIsWithdrawModalOpen(false)}
            />

            {/* 일반 알림 모달 */}
            <CommonModal
                isOpen={isAlertModalOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => {
                    setIsAlertModalOpen(false);
                    if (alertCallback) {
                        alertCallback();
                        setAlertCallback(null);
                    }
                }}
            />
        </div>
    );
};

export default SettingsPage;
