import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';
import { requestPermission } from "../utils/pushNotification";

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

    // Auto Login Check
    React.useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            navigate('/main');
        }
    }, [navigate]);

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
                    localStorage.setItem('accessToken', data.token); // Store Access Token

                    // Request notification permission after login
                    requestPermission();
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

            <div className="min-h-screen bg-white flex flex-col items-center justify-start pt-safe px-4 pb-8 font-['Pretendard']">
                <div className="w-full max-w-md px-2 sm:px-4 pt-20 sm:pt-28">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-6">
                        <img src="/images/main_title.png" alt="Bandicon" className="w-[170px] sm:w-[200px] h-auto object-contain" />
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-gray-100">
                        <h2 className="text-xl font-bold text-center text-slate-700 mb-6">로그인</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 pl-1">아이디</label>
                                <input
                                    type="text"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-[#00B2FF] focus:bg-white rounded-xl text-sm focus:ring-2 focus:ring-[#00B2FF]/20 outline-none transition-all"
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 pl-1">비밀번호</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-transparent focus:border-[#00B2FF] focus:bg-white rounded-xl text-sm focus:ring-2 focus:ring-[#00B2FF]/20 outline-none transition-all"
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-[#00B2FF] text-white rounded-xl font-bold text-base mt-2 hover:bg-[#009CE0] active:scale-[0.99] transition-all shadow-md shadow-[#00B2FF]/20"
                            >
                                로그인
                            </button>
                        </form>
                    </div>

                    {/* Footer Links */}
                    <div className="flex justify-center items-center gap-3 mt-5 text-xs text-gray-500 font-medium">
                        <button onClick={() => navigate('/find-id')} className="hover:text-gray-800 transition-colors">아이디 찾기</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => navigate('/find-password')} className="hover:text-gray-800 transition-colors">비밀번호 찾기</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => navigate('/signup')} className="text-[#00B2FF] font-semibold hover:underline transition-colors">회원가입</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
