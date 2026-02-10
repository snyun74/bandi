import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

interface CommDetail {
    commCd: string;
    commDtlCd: string;
    commDtlNm: string;
    sortOrd: number;
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
    const [emailDomains, setEmailDomains] = useState<CommDetail[]>([]);
    const [genders, setGenders] = useState<CommDetail[]>([]);
    const [isCustomEmail, setIsCustomEmail] = useState(false);

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
    }, []);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

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

    const validateForm = () => {
        if (!isIdChecked) return '아이디 중복 확인을 해주세요.';
        if (!formData.userNm) return '이름을 입력해주세요.';
        if (!isNickChecked) return '닉네임 중복 확인을 해주세요.';
        if (!formData.password) return '비밀번호를 입력해주세요.';
        if (formData.password !== formData.passwordConfirm) return '비밀번호가 일치하지 않습니다.';
        if (!formData.phoneNo) return '휴대폰 번호를 입력해주세요.';

        // Email is optional, but if ID is entered, Domain is required unless custom
        if (formData.emailId && !isCustomEmail && !formData.emailDomain) {
            return '이메일 도메인을 선택해주세요.';
        }

        // Phone Validation (Allow with or without hyphens)
        // Matches: 010-1234-5678, 01012345678, 02-123-4567, 021234567
        const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phoneRegex.test(formData.phoneNo)) return '휴대폰 번호 형식이 올바르지 않습니다.';

        // Partial BirthDate Validation
        if (formData.birthDt && formData.birthDt.length !== 8) return '생년월일은 8자리(YYYYMMDD)로 입력해주세요.';

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

            <div className="min-h-screen bg-white flex flex-col font-['Jua']">
                <div className="flex-1 w-full max-w-md mx-auto px-6 py-8 flex flex-col">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl text-[#003C48] font-bold tracking-wide">
                            회원가입
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">
                            밴디의 새로운 멤버가 되어보세요!
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 flex-1">

                        {/* User ID */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-sm">아이디 <span className="text-[#00BDF8]">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                    placeholder="아이디 입력"
                                />
                                <button
                                    type="button"
                                    onClick={checkIdDuplicate}
                                    className={`px-4 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-colors border ${isIdChecked ? 'bg-[#00BDF8] text-white border-[#00BDF8]' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                >
                                    중복확인
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-sm">비밀번호 <span className="text-[#00BDF8]">*</span></label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                placeholder="비밀번호"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-sm">비밀번호 확인 <span className="text-[#00BDF8]">*</span></label>
                            <input
                                type="password"
                                name="passwordConfirm"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                placeholder="비밀번호 확인"
                            />
                        </div>

                        {/* Name & Nickname */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-sm">이름 <span className="text-[#00BDF8]">*</span></label>
                                <input
                                    type="text"
                                    name="userNm"
                                    value={formData.userNm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                    placeholder="실명"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-sm">닉네임 <span className="text-[#00BDF8]">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="userNickNm"
                                        value={formData.userNickNm}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400 min-w-0"
                                        placeholder="별명"
                                    />
                                    <button
                                        type="button"
                                        onClick={checkNickDuplicate}
                                        className={`px-3 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-colors border ${isNickChecked ? 'bg-[#00BDF8] text-white border-[#00BDF8]' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-sm">이메일</label>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="emailId"
                                        value={formData.emailId}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                        placeholder="이메일 ID"
                                    />
                                    <span className="text-gray-400 font-bold">@</span>
                                    <select
                                        onChange={handleEmailDomainChange}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48]"
                                    >
                                        <option value="">선택</option>
                                        {emailDomains.map(code => (
                                            <option key={code.commDtlCd} value={code.commDtlNm}>
                                                {code.commDtlNm}
                                            </option>
                                        ))}
                                        <option value="direct">직접입력</option>
                                    </select>
                                </div>
                                {isCustomEmail && (
                                    <input
                                        type="text"
                                        name="emailDomain"
                                        value={formData.emailDomain}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                        placeholder="도메인 직접 입력"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                            <label className="text-[#003C48] font-bold text-sm">휴대폰 <span className="text-[#00BDF8]">*</span></label>
                            <input
                                type="text"
                                name="phoneNo"
                                value={formData.phoneNo}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                placeholder="01012345678 (하이픈 '-' 없이 입력 가능)"
                                inputMode="tel"
                            />
                        </div>

                        {/* Birth & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-sm">생년월일</label>
                                <input
                                    type="text"
                                    name="birthDt"
                                    value={formData.birthDt}
                                    onChange={handleChange}
                                    maxLength={8}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48] placeholder-gray-400"
                                    placeholder="YYYYMMDD"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[#003C48] font-bold text-sm">성별</label>
                                <select
                                    name="genderCd"
                                    value={formData.genderCd}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00BDF8] text-sm text-[#003C48]"
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

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6 pb-8">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 py-4 bg-gray-100 text-[#003C48] rounded-2xl font-bold text-base hover:bg-gray-200 transition-all active:scale-95"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-4 bg-[#00BDF8] text-white rounded-2xl font-bold text-base shadow-md hover:bg-[#00ACD8] transition-all active:scale-95 shadow-[#00BDF8]/20"
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
