import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

interface CommDetail {
    commCd: string;
    commDtlCd: string;
    commDtlNm: string;
    sortOrd: number;
}

interface PrivacyPolicy {
    privacyAgreeVerId: string;
    privacyAgreeContent: string;
}

const SignupPage: React.FC = () => {
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        userNm: '',
        userNickNm: '',
        password: '',
        passwordConfirm: '',
        emailId: '',
        emailDomain: '',
        phoneNo: '',
        birthDt: '',
        genderCd: '',
    });

    // Validation & Check State
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [isNickChecked, setIsNickChecked] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isSmsSent, setIsSmsSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [timer, setTimer] = useState(0);
    const [emailDomains, setEmailDomains] = useState<CommDetail[]>([]);
    const [genders, setGenders] = useState<CommDetail[]>([]);
    const [isCustomEmail, setIsCustomEmail] = useState(false);
    
    // Privacy State
    const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
    const [isPrivacyViewed, setIsPrivacyViewed] = useState(false);
    const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(null);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        message: '',
        onConfirm: () => { },
    });

    const showModal = (message: string, callback?: () => void) => {
        setModal({
            isOpen: true,
            message,
            onConfirm: () => {
                setModal(prev => ({ ...prev, isOpen: false }));
                if (callback) callback();
            },
        });
    };

    // Load Common Codes
    useEffect(() => {
        const fetchCodes = async () => {
            try {
                // Email Domains (BD400)
                const emailRes = await fetch('/api/auth/common/codes/BD400');
                if (emailRes.ok) setEmailDomains(await emailRes.json());

                // Genders (BD001)
                const genderRes = await fetch('/api/auth/common/codes/BD001');
                if (genderRes.ok) setGenders(await genderRes.json());
            } catch (error) {
                console.error("Failed to fetch common codes", error);
            }
        };
        fetchCodes();

        const fetchPrivacyPolicy = async () => {
            try {
                const res = await fetch('/api/auth/privacy-policy');
                if (res.ok) {
                    const data = await res.json();
                    setPrivacyPolicy(data);
                }
            } catch (error) {
                console.error("Failed to fetch privacy policy", error);
            }
        };
        fetchPrivacyPolicy();
    }, []);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Sanitize phone and birthDt as they are typed
        let sanitizedValue = value;
        if (name === 'phoneNo' || name === 'birthDt') {
            sanitizedValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

        if (name === 'userId') setIsIdChecked(false);
        if (name === 'userNickNm') setIsNickChecked(false);
    };

    const handleEmailDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'direct') {
            setIsCustomEmail(true);
            setFormData(prev => ({ ...prev, emailDomain: '' }));
        } else {
            setIsCustomEmail(false);
            setFormData(prev => ({ ...prev, emailDomain: value }));
        }
    };

    const checkIdDuplicate = async () => {
        if (!formData.userId) {
            showModal('아이디를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch(`/api/auth/check-id?userId=${formData.userId}`);
            const data = await res.json();
            if (data.exists) {
                showModal('이미 사용 중인 아이디입니다.');
                setIsIdChecked(false);
            } else {
                showModal('사용 가능한 아이디입니다.');
                setIsIdChecked(true);
            }
        } catch (error) {
            showModal('아이디 중복 확인 중 오류가 발생했습니다.');
        }
    };

    const checkNickDuplicate = async () => {
        if (!formData.userNickNm) {
            showModal('닉네임을 입력해주세요.');
            return;
        }
        try {
            const res = await fetch(`/api/auth/check-nickname?nickname=${formData.userNickNm}`);
            const data = await res.json();
            if (data.exists) {
                showModal('이미 사용 중인 닉네임입니다.');
                setIsNickChecked(false);
            } else {
                showModal('사용 가능한 닉네임입니다.');
                setIsNickChecked(true);
            }
        } catch (error) {
            showModal('닉네임 중복 확인 중 오류가 발생했습니다.');
        }
    };

    // SMS 인증번호 발송
    const handleSendSms = async () => {
        if (!formData.phoneNo) {
            showModal('휴대폰 번호를 입력해주세요.');
            return;
        }
        const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(formData.phoneNo)) {
            showModal('휴대폰 번호 형식이 올바르지 않습니다.');
            return;
        }

        try {
            const cleanPhone = formData.phoneNo.replace(/-/g, '');
            
            // 1. 중복 체크
            const checkRes = await fetch(`/api/auth/check-phone?phoneNumber=${cleanPhone}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.exists) {
                    showModal('이미 휴대폰 번호로는 가입되어 있습니다.');
                    return;
                }
            }

            // 2. 인증번호 발송
            const res = await fetch(`/api/sms/send-verification?phoneNumber=${cleanPhone}`, { method: 'POST' });
            if (res.ok) {
                const text = await res.text();
                if (text === 'OK') {
                    showModal('인증번호가 발송되었습니다.');
                    setIsSmsSent(true);
                    setTimer(180); // 3분
                } else {
                    showModal(text);
                }
            }
        } catch (error) {
            showModal('인증번호 발송 실패');
        }
    };

    // SMS 인증번호 확인
    const handleVerifySms = async () => {
        if (!verificationCode) {
            showModal('인증번호를 입력해주세요.');
            return;
        }
        try {
            const cleanPhone = formData.phoneNo.replace(/-/g, '');
            const res = await fetch(`/api/sms/verify-code?phoneNumber=${cleanPhone}&code=${verificationCode}`, { method: 'POST' });
            if (res.ok) {
                const text = await res.text();
                if (text === 'OK') {
                    showModal('인증되었습니다.');
                    setIsPhoneVerified(true);
                    setTimer(0);
                } else {
                    showModal(text);
                }
            }
        } catch (error) {
            showModal('인증 확인 실패');
        }
    };

    // Timer Effect
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const validateForm = () => {
        if (!isIdChecked) return '아이디 중복 확인을 해주세요.';
        if (!formData.password) return '비밀번호를 입력해주세요.';
        if (formData.password !== formData.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
        if (!formData.userNm) return '이름을 입력해주세요.';
        if (!isNickChecked) return '닉네임 중복 확인을 해주세요.';
        if (!formData.phoneNo) return '휴대폰 번호를 입력해주세요.';
        if (!isPhoneVerified) return '휴대폰 번호 인증을 해주세요.';
        if (formData.birthDt && formData.birthDt.length !== 8) return '생년월일은 8자리(YYYYMMDD)로 입력해주세요.';
        if (!formData.genderCd) return '성별을 선택해주세요.';
        
        // Final sequential check for Privacy
        if (!isPrivacyAgreed) return '개인정보 수집 및 이용에 동의해주세요.';
        if (!isPrivacyViewed) return '개인정보 수집 및 이용 내용을 확인해주세요.';

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) {
            showModal(error);
            return;
        }

        // Construct email only if emailId is present
        const fullEmail = formData.emailId
            ? `${formData.emailId}@${formData.emailDomain}`
            : '';

        const payload = {
            userId: formData.userId,
            userNm: formData.userNm,
            userNickNm: formData.userNickNm,
            password: formData.password,
            email: fullEmail,
            phoneNo: formData.phoneNo.replace(/-/g, ''), // Send numbers only to backend? Or keep as is? User said verify format. I will strip hyphens for consistency if backend expects numbers, but standard usually keeps them or strips. I will strip hyphens to match "no hyphen" request implicitly (clean data).
            birthDt: formData.birthDt,
            genderCd: formData.genderCd,
            privacyAgreeYn: isPrivacyAgreed ? 'Y' : 'N',
            privacyAgreeVerId: privacyPolicy?.privacyAgreeVerId || '',
        };

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok) {
                showModal('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.', () => {
                    navigate('/');
                });
            } else {
                showModal(`회원가입 실패: ${data.message}`);
            }
        } catch (error) {
            showModal('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <>
            <CommonModal
                isOpen={modal.isOpen}
                type="alert"
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Privacy Policy Modal */}
            <CommonModal
                isOpen={isPrivacyModalOpen}
                type="alert"
                title="개인정보 수집 및 이용 동의"
                icon={<img src="/pwa-192x192.png" className="w-10 h-10 object-contain" alt="logo" />}
                onConfirm={() => {
                    setIsPrivacyViewed(true);
                    setIsPrivacyAgreed(true);
                    setIsPrivacyModalOpen(false);
                }}
                onCancel={() => setIsPrivacyModalOpen(false)}
            >
                <div className="max-h-[60vh] overflow-y-auto px-1 py-2 text-[14px] text-gray-600 leading-relaxed">
                    {privacyPolicy ? (
                        <div dangerouslySetInnerHTML={{ __html: privacyPolicy.privacyAgreeContent }} />
                    ) : (
                        <p className="text-center py-10">약관을 불러오는 중입니다...</p>
                    )}
                </div>
            </CommonModal>

            <div className="min-h-screen bg-white flex flex-col font-['Pretendard']">
                <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 flex flex-col">
                    <div className="text-center mb-6">
                        <h1 className="text-[14px] text-[#003C48] font-bold tracking-wide">
                            회원가입
                        </h1>
                        <p className="text-gray-400 text-[14px] mt-2">
                            밴디의 새로운 멤버가 되어보세요!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">

                        {/* User ID */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-[14px]">아이디 <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48]"
                                    placeholder="아이디 입력"
                                />
                                <button
                                    type="button"
                                    onClick={checkIdDuplicate}
                                    className={`px-3 py-2.5 text-[14px] font-bold rounded-xl whitespace-nowrap transition-colors border ${isIdChecked ? 'bg-[#00BDF8] text-white border-[#00BDF8]' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                >
                                    중복확인
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-[14px]">비밀번호 <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                placeholder="비밀번호"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-[14px]">비밀번호 확인 <span className="text-red-500">*</span></label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                placeholder="비밀번호 확인"
                            />
                        </div>

                        {/* Name & Nickname */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-[14px]">이름 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="userNm"
                                    value={formData.userNm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                    placeholder="실명"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-[14px]">닉네임 <span className="text-red-500">*</span></label>
                                <div className="flex gap-1.5">
                                    <input
                                        type="text"
                                        name="userNickNm"
                                        value={formData.userNickNm}
                                        onChange={handleChange}
                                        className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                        placeholder="별명"
                                    />
                                    <button
                                        type="button"
                                        onClick={checkNickDuplicate}
                                        className={`px-2.5 py-2.5 text-[14px] font-bold rounded-xl whitespace-nowrap transition-colors border ${isNickChecked ? 'bg-[#00BDF8] text-white border-[#00BDF8]' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        </div>


                        {/* Phone */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-[14px]">휴대폰 <span className="text-red-500">*</span></label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    name="phoneNo"
                                    value={formData.phoneNo}
                                    onChange={(e) => {
                                        if (isPhoneVerified) return;
                                        handleChange(e);
                                    }}
                                    readOnly={isPhoneVerified}
                                    className={`w-[160px] flex-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400 ${isPhoneVerified ? 'bg-gray-100' : ''}`}
                                    placeholder="01012345678"
                                    inputMode="tel"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendSms}
                                    disabled={isPhoneVerified}
                                    className={`flex-1 px-3 py-2.5 text-[14px] font-bold rounded-xl whitespace-nowrap transition-colors border ${isPhoneVerified ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {isPhoneVerified ? '인증완료' : isSmsSent ? '재발송' : '인증요청'}
                                </button>
                            </div>
                        </div>

                        {/* SMS Verification Code */}
                        {isSmsSent && !isPhoneVerified && (
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-[14px]">인증번호 <span className="text-red-500">*</span></label>
                                <div className="flex gap-1.5">
                                    <div className="flex-1 min-w-0 relative">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                            placeholder="인증번호"
                                            inputMode="numeric"
                                            maxLength={6}
                                        />
                                        {timer > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-red-500">
                                                {formatTime(timer)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleVerifySms}
                                        className="px-4 py-2.5 text-[14px] font-bold rounded-xl whitespace-nowrap transition-colors bg-[#00BDF8] text-white border border-[#00BDF8] hover:bg-[#00ACD8]"
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Birth & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-[14px]">생년월일</label>
                                <input
                                    type="text"
                                    name="birthDt"
                                    value={formData.birthDt}
                                    onChange={handleChange}
                                    maxLength={8}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                    placeholder="YYYYMMDD"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-[14px]">성별 <span className="text-red-500">*</span></label>
                                <select
                                    name="genderCd"
                                    value={formData.genderCd}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48]"
                                >
                                    <option value="">선택</option>
                                    {genders.map(code => (
                                        <option key={code.commDtlCd} value={code.commDtlCd}>
                                            {code.commDtlNm}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Email - Moved to bottom */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-[14px]">이메일</label>
                            <div className="flex gap-1.5 items-start">
                                <input
                                    type="text"
                                    name="emailId"
                                    value={formData.emailId}
                                    onChange={handleChange}
                                    className="w-[42%] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                    placeholder="ID"
                                />
                                <span className="text-gray-400 font-bold self-center">@</span>
                                <div className="flex-1 flex flex-col gap-2 min-w-0">
                                    <select
                                        onChange={handleEmailDomainChange}
                                        className="w-full px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48]"
                                    >
                                        <option value="">선택</option>
                                        {emailDomains.map(code => (
                                            <option key={code.commDtlCd} value={code.commDtlNm}>
                                                {code.commDtlNm}
                                            </option>
                                        ))}
                                        <option value="direct">직접</option>
                                    </select>
                                    {isCustomEmail && (
                                        <input
                                            type="text"
                                            name="emailDomain"
                                            value={formData.emailDomain}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-[14px] text-[#003C48] placeholder-gray-400"
                                            placeholder="도메인"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Privacy Agreement */}
                        <div className="pt-1 pb-2">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center">
                                        <input
                                            id="privacy-chk"
                                            type="checkbox"
                                            checked={isPrivacyAgreed}
                                            onChange={(e) => setIsPrivacyAgreed(e.target.checked)}
                                            className="w-5 h-5 rounded-md border-gray-300 text-[#00BDF8] focus:ring-[#00BDF8] cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="privacy-chk" className="text-[14px] font-bold text-[#003C48] cursor-pointer">
                                        개인정보 수집 및 이용 동의 <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPrivacyModalOpen(true)}
                                    className="text-[14px] font-bold text-gray-400 underline decoration-gray-300 underline-offset-4 hover:text-[#00BDF8] hover:decoration-[#00BDF8] transition-colors"
                                >
                                    내용보기
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 pb-6">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 py-3.5 bg-gray-100 text-[#003C48] rounded-2xl font-bold text-[14px] hover:bg-gray-200 transition-all active:scale-95"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3.5 bg-[#00BDF8] text-white rounded-2xl font-bold text-[14px] shadow-md hover:bg-[#00ACD8] transition-all active:scale-95 shadow-[#00BDF8]/20"
                            >
                                회원가입
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
};

export default SignupPage;
