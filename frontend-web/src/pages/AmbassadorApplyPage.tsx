import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMedal, FaCheckCircle, FaExclamationTriangle, FaClock, FaYoutube, FaLink, FaMusic, FaUserEdit, FaFileUpload, FaTimes, FaSpinner, FaPaperclip } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import { uploadFileApi } from '../utils/fileUtils';

interface CommonCode {
    commCd: string;
    commDtlCd: string;
    commDtlNm: string;
    commOrder?: number;
}

interface AmbassadorData {
    userId: string;
    activityField: string;
    introContent: string;
    portfolioUrl?: string;
    snsUrl?: string;
    attachNo?: number | null;
    applyStatCd: 'R' | 'A' | 'J';
    rejectReason?: string;
    insDtime?: string;
    updDtime?: string;
}

const AmbassadorApplyPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || '';

    const [loading, setLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [currentAmbassador, setCurrentAmbassador] = useState<AmbassadorData | null>(null);
    const [fieldCodes, setFieldCodes] = useState<CommonCode[]>([]);

    // Form states
    const [activityField, setActivityField] = useState<string>('');
    const [introContent, setIntroContent] = useState<string>('');
    const [portfolioUrl, setPortfolioUrl] = useState<string>('');
    const [snsUrl, setSnsUrl] = useState<string>('');
    const [attachNo, setAttachNo] = useState<number | null>(null);
    const [attachFileName, setAttachFileName] = useState<string>('');
    const [attachFileUrl, setAttachFileUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // Modal states
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
        if (!userId) {
            navigate('/login');
            return;
        }

        fetchCommonCodes();
        fetchAmbassadorStatus();
    }, [userId]);

    const fetchCommonCodes = async () => {
        try {
            const res = await fetch('/api/auth/common/codes/BD900');
            if (res.ok) {
                const data: CommonCode[] = await res.json();
                setFieldCodes(data || []);
                if (data && data.length > 0 && !activityField) {
                    setActivityField(data[0].commDtlCd);
                }
            }
        } catch (err) {
            console.error('Failed to load BD900 codes:', err);
        }
    };

    const fetchAmbassadorStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ambassador/status?userId=${userId}`);
            if (res.ok) {
                const text = await res.text();
                if (text && text.trim().length > 0) {
                    const data: AmbassadorData = JSON.parse(text);
                    if (data && data.userId) {
                        setCurrentAmbassador(data);
                        setActivityField(data.activityField || '');
                        setIntroContent(data.introContent || '');
                        setPortfolioUrl(data.portfolioUrl || '');
                        setSnsUrl(data.snsUrl || '');
                        setAttachNo(data.attachNo || null);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load ambassador info:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAttachFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const res = await uploadFileApi(file, 'ambassador', userId);
            setAttachNo(res.attachNo);
            setAttachFileName(file.name);
            setAttachFileUrl(res.fullUrl);
        } catch (err: any) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: err.message || '파일 업로드에 실패했습니다.'
            });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveAttach = () => {
        setAttachNo(null);
        setAttachFileName('');
        setAttachFileUrl('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalField = activityField.trim();
        if (!finalField) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '활동 분야를 선택해 주세요.'
            });
            return;
        }

        if (!introContent.trim() || introContent.trim().length < 10) {
            setModal({
                isOpen: true,
                type: 'alert',
                message: '자기소개 및 활동계획을 최소 10자 이상 작성해 주세요.'
            });
            return;
        }

        const payload = {
            activityField: finalField,
            introContent: introContent.trim(),
            portfolioUrl: portfolioUrl.trim(),
            snsUrl: snsUrl.trim(),
            attachNo: attachNo
        };

        setIsSubmitting(true);
        try {
            const isApproved = currentAmbassador?.applyStatCd === 'A';
            const endpoint = isApproved ? `/api/ambassador/info?userId=${userId}` : `/api/ambassador/apply?userId=${userId}`;
            const method = isApproved ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                setCurrentAmbassador(updated);
                setModal({
                    isOpen: true,
                    type: 'alert',
                    title: isApproved ? '수정 완료' : '신청 완료',
                    message: isApproved
                        ? '엠버서더 정보가 성공적으로 수정되었습니다.'
                        : '엠버서더 신청이 정상 접수되었습니다.\n관리자 심사 후 승인 처리됩니다.',
                    onConfirm: () => navigate('/main/profile')
                });
            } else {
                const errData = await res.json().catch(() => null);
                setModal({
                    isOpen: true,
                    type: 'alert',
                    message: errData?.message || '처리 도중 오류가 발생했습니다. 다시 시도해 주세요.'
                });
            }
        } catch (err) {
            console.error('Submit error:', err);
            setModal({
                isOpen: true,
                type: 'alert',
                message: '네트워크 통신 오류가 발생했습니다.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isApproved = currentAmbassador?.applyStatCd === 'A';
    const isPending = currentAmbassador?.applyStatCd === 'R';
    const isRejected = currentAmbassador?.applyStatCd === 'J';

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3.5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <h1 className="text-[16px] font-extrabold text-[#003C48] flex items-center gap-1.5">
                        <FaMedal className="text-amber-500" size={17} />
                        {isApproved ? '엠버서더 정보 수정' : isRejected ? '엠버서더 재신청' : '엠버서더 신청'}
                    </h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                {/* Status Notice Banner */}
                {isPending && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 shadow-xs">
                        <FaClock className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-amber-900 space-y-0.5">
                            <h3 className="font-bold">현재 심사 대기 중입니다.</h3>
                            <p className="text-amber-700 leading-relaxed text-[11px]">
                                관리자가 제출하신 정보를 심사하고 있습니다. 내용 수정 후 다시 저장하시면 수정된 정보로 심사가 진행됩니다.
                            </p>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-3 shadow-xs">
                        <FaExclamationTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-red-900 space-y-1">
                            <h3 className="font-bold">심사가 반려되었습니다.</h3>
                            {currentAmbassador.rejectReason && (
                                <p className="text-red-700 bg-white/70 p-2.5 rounded-xl text-[11px] border border-red-100 leading-relaxed">
                                    <strong>사유:</strong> {currentAmbassador.rejectReason}
                                </p>
                            )}
                            <p className="text-red-600 text-[11px] leading-relaxed">
                                반려 사유를 확인하시고 정보를 보완하여 재신청해 주시기 바랍니다.
                            </p>
                        </div>
                    </div>
                )}

                {isApproved && (
                    <div className="p-4 rounded-2xl bg-green-50 border border-green-200/80 flex items-start gap-3 shadow-xs">
                        <FaCheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-green-900 space-y-0.5">
                            <h3 className="font-bold">공식 엠버서더 승인 회원입니다.</h3>
                            <p className="text-green-700 text-[11px] leading-relaxed">
                                등록된 엠버서더 프로필 및 소개 정보를 자유롭게 수정하실 수 있습니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 1. 활동 분야 선택 */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                        <label className="block text-xs font-bold text-[#003C48]">
                            활동 분야 <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11px] text-gray-400">
                            주요 레슨 및 활동 전문 분야를 선택해 주세요.
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                            {fieldCodes.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">활동 분야 코드를 불러오는 중입니다...</p>
                            ) : (
                                fieldCodes.map((code) => {
                                    const selected = activityField === code.commDtlCd || activityField === code.commDtlNm;
                                    return (
                                        <button
                                            type="button"
                                            key={code.commDtlCd}
                                            onClick={() => setActivityField(code.commDtlCd)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                selected
                                                    ? 'bg-[#00BDF8] text-white shadow-sm font-bold scale-[1.02]'
                                                    : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            {code.commDtlNm}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 2. 자기소개 및 활동계획 */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2.5">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-[#003C48]">
                                자기소개 및 활동 계획 <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] text-gray-400">
                                {introContent.length} / 1000자
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            음악 경력, 교육 철학, 진행하고자 하는 온라인/오프라인 강의 계획을 작성해 주세요.
                        </p>
                        <textarea
                            value={introContent}
                            onChange={(e) => setIntroContent(e.target.value)}
                            placeholder="예: 버클리 음대 실용음악과 졸업 후 10년간 세션 및 레슨 활동을 진행하고 있습니다. 초보자도 쉽게 따라할 수 있는 실전 밴드 앙상블 교육과정을 제공하고자 합니다."
                            rows={5}
                            maxLength={1000}
                            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {/* 3. 포트폴리오 및 SNS 링크 */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3.5">
                        <h3 className="text-xs font-bold text-[#003C48]">
                            포트폴리오 & 대표 SNS / 유튜브
                        </h3>
                        <p className="text-[11px] text-gray-400">
                            회원 및 심사자가 확인할 수 있는 프로필 링크를 입력해 주세요.
                        </p>

                        <div className="space-y-2.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                    <FaLink className="text-blue-500" /> 포트폴리오 URL (노션, 웹사이트, 음원 링크 등)
                                </label>
                                <input
                                    type="url"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                    <FaYoutube className="text-red-500" /> 대표 SNS / 유튜브 채널 URL
                                </label>
                                <input
                                    type="url"
                                    value={snsUrl}
                                    onChange={(e) => setSnsUrl(e.target.value)}
                                    placeholder="https://youtube.com/@... 또는 https://instagram.com/..."
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. 증빙자료 / 포트폴리오 첨부파일 */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-[#003C48] flex items-center gap-1.5">
                                <FaPaperclip className="text-[#00BDF8]" />
                                <span>증빙 자료 및 포트폴리오 파일</span>
                            </h3>
                            <span className="text-[10px] text-gray-400">선택 사항</span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                            이력서, 프로필 이미지, 자격증, 활동 증빙 PDF 또는 이미지 파일을 첨부할 수 있습니다.
                        </p>

                        {attachNo ? (
                            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#00BDF8]/10 text-[#00BDF8] flex items-center justify-center shrink-0">
                                        <FaPaperclip size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">
                                            {attachFileName || `첨부파일 (ID: ${attachNo})`}
                                        </p>
                                        <p className="text-[10px] text-green-600 font-bold">✓ 파일 등록 완료</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveAttach}
                                    className="text-gray-400 hover:text-red-500 p-2 rounded-xl transition-colors"
                                    title="첨부파일 삭제"
                                >
                                    <FaTimes size={15} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-[#00BDF8] rounded-2xl p-5 bg-gray-50/60 hover:bg-[#00BDF8]/5 transition-all cursor-pointer">
                                <input
                                    type="file"
                                    onChange={handleAttachFileChange}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                                {isUploading ? (
                                    <div className="flex items-center gap-2 text-xs text-[#00BDF8] font-medium py-1">
                                        <FaSpinner className="animate-spin" />
                                        <span>파일 업로드 중...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                        <FaFileUpload className="text-gray-400" size={22} />
                                        <span className="text-xs font-semibold text-gray-700">증빙 파일 선택</span>
                                        <span className="text-[10px] text-gray-400">PDF, JPG, PNG 등 (최대 100MB)</span>
                                    </div>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Bottom Submit Button */}
                    <div className="pt-2 pb-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-2xl text-[14px] font-bold text-white transition-all shadow-lg ${
                                isSubmitting
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'bg-[#00BDF8] hover:bg-[#009fd4] active:scale-[0.98] shadow-[#00BDF8]/30'
                            }`}
                        >
                            {isSubmitting
                                ? '처리 중...'
                                : isApproved
                                ? '엠버서더 정보 수정 완료'
                                : isRejected
                                ? '엠버서더 재신청하기'
                                : isPending
                                ? '신청 내용 수정 저장'
                                : '엠버서더 신청하기'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Common Alert/Confirm Modal */}
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={() => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                    if (modal.onConfirm) modal.onConfirm();
                }}
                onCancel={() => {
                    setModal(prev => ({ ...prev, isOpen: false }));
                }}
            />
        </div>
    );
};

export default AmbassadorApplyPage;
