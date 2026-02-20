import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FindIdPage: React.FC = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authCode, setAuthCode] = useState('');

    const handleGetAuthCode = () => {
        // Logic will be added later
        console.log('Get auth code for:', phoneNumber);
    };

    const handleVerify = () => {
        // Logic will be added later
        console.log('Verify auth code:', authCode);
    };

    const handleNext = () => {
        // Logic will be added later
        console.log('Next step');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center">
            {/* Header Navigation */}
            <div className="w-full max-w-md p-4 mt-2 flex justify-end gap-4 text-sm text-gray-700 font-medium">
                <button onClick={() => navigate('/')} className="hover:text-black">로그인</button>
                <button onClick={() => navigate('/signup')} className="hover:text-black">회원가입</button>
            </div>

            <div className="w-full max-w-md px-6 mt-4 flex flex-col items-center">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/images/main_title.png" alt="Bandicon" className="w-80 mb-2" />
                </div>

                {/* Find ID Card */}
                <div className="w-full bg-white rounded-[2rem] p-8 shadow-[0_0_20px_rgba(0,0,0,0.03)] border border-gray-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-8">아이디 찾기</h2>

                    <div className="space-y-6">
                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-800">전화번호</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="flex-1 px-4 py-3.5 bg-[#f4f6f8] border border-transparent rounded-xl text-sm focus:bg-white focus:border-[#00B2FF] focus:ring-1 focus:ring-[#00B2FF] outline-none text-slate-700 placeholder-slate-400"
                                    placeholder="- 없이 11자리"
                                />
                                <button
                                    onClick={handleGetAuthCode}
                                    className="px-5 py-3.5 bg-[#f4f6f8] text-slate-600 rounded-xl text-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
                                >
                                    인증번호 받기
                                </button>
                            </div>
                        </div>

                        {/* Auth Code */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-800">인증번호</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                    className="w-full pl-4 pr-20 py-3.5 bg-[#f4f6f8] border border-transparent rounded-xl text-sm focus:bg-white focus:border-[#00B2FF] focus:ring-1 focus:ring-[#00B2FF] outline-none text-slate-700 placeholder-slate-400"
                                    placeholder="6자리 숫자"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <button
                                        onClick={handleVerify}
                                        className="px-4 py-2 bg-[#00B2FF] text-white rounded-lg text-sm font-medium hover:bg-[#009CE0] transition-colors"
                                    >
                                        인증
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Next Button */}
                        <div className="pt-4 mt-8">
                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-[#f4f6f8] text-slate-500 rounded-xl font-medium text-base hover:bg-slate-200 transition-colors"
                            >
                                다음
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindIdPage;
