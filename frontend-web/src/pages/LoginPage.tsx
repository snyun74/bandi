import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string, callback?: () => void) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: () => {
                closeModal();
                if (callback) callback();
            },
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt:', { id });

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: id, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.token) {
                    localStorage.setItem('userId', id); // Store User ID
                }
                navigate('/main');
            } else {
                showAlert('로그인 실패: ' + (data.message || '아이디 또는 비밀번호를 확인해주세요.'));
            }
        } catch (error) {
            console.error('Login Error:', error);
            showAlert('로그인 중 오류가 발생했습니다.');
        }
    };

    const handleSocialLogin = (provider: string) => {
        console.log(`Social login attempt: ${provider}`);

        if (provider === 'kakao') {
            const REST_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;
            const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;
            const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=login`;

            window.location.href = KAKAO_AUTH_URL;
        } else {
            showAlert(`${provider} 소셜 로그인은 준비 중입니다.`);
        }
    };

    return (
        <>
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />

            <div className="min-h-screen bg-white flex flex-col items-center">
                {/* Header Navigation */}
                <div className="w-full max-w-md p-2 flex justify-end gap-4 text-sm text-gray-600 font-medium">
                    <button onClick={() => navigate('/signup')} className="hover:text-black">회원가입</button>
                </div>

                <div className="w-full max-w-md px-6 mt-1">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-1">
                        <img src="/images/main_title.png" alt="Bandicon" className="w-80 mb-2" />
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-3xl p-1 shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-center text-slate-700 mb-8 mt-2">로그인</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 pl-1">아이디</label>
                                    <input
                                        type="text"
                                        value={id}
                                        onChange={(e) => setId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                        placeholder=""
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 pl-1">비밀번호</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                        placeholder=""
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-[#00B2FF] text-white rounded-xl font-bold text-lg mt-3 hover:bg-[#009CE0] transition-colors shadow-sm"
                                >
                                    로그인
                                </button>
                            </form>

                            <div className="mt-6 mb-2">
                                <p className="text-sm text-gray-500 mb-3 ml-1">다른 로그인</p>
                                <button
                                    onClick={() => handleSocialLogin('kakao')}
                                    className="w-full py-3 bg-[#FEE500] text-[#391B1B] rounded-xl font-bold text-base hover:bg-[#EED000] transition-colors"
                                >
                                    Kakao 로그인
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="flex justify-end gap-4 mt-4 text-xs text-gray-500 pr-2">
                        <button className="hover:text-gray-800">아이디 찾기</button>
                        <button className="hover:text-gray-800">비밀번호 찾기</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
