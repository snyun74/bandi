import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

const FindPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isSmsSent, setIsSmsSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [modal, setModal] = useState({ isOpen: false, message: '', onConfirm: () => { } });

    // Reset Password Popup State
    const [isResetPopupOpen, setIsResetPopupOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const showModal = (message: string, onConfirm = () => { }) => {
        setModal({ isOpen: true, message, onConfirm });
    };

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleGetAuthCode = async () => {
        if (!phoneNumber) {
            showModal('전화번호를 입력해주세요.');
            return;
        }
        const cleanPhone = phoneNumber.replace(/-/g, '');
        try {
            const res = await fetch(`/api/sms/send-verification?phoneNumber=${cleanPhone}`, { method: 'POST' });
            if (res.ok) {
                const text = await res.text();
                if (text === 'OK') {
                    showModal('인증번호가 발송되었습니다.');
                    setIsSmsSent(true);
                    setTimer(180);
                } else {
                    showModal(text);
                }
            }
        } catch (error) {
            showModal('인증번호 발송 실패');
        }
    };

    const handleVerify = async () => {
        if (!authCode) {
            showModal('인증번호를 입력해주세요.');
            return;
        }
        const cleanPhone = phoneNumber.replace(/-/g, '');
        try {
            const res = await fetch(`/api/sms/verify-code?phoneNumber=${cleanPhone}&code=${authCode}`, { method: 'POST' });
            const text = await res.text();
            if (text === 'OK') {
                showModal('인증되었습니다.');
                setIsVerified(true);
            } else {
                showModal(text);
            }
        } catch (error) {
            showModal('인증 확인 중 오류가 발생했습니다.');
        }
    };

    const handleSubmitReset = async () => {
        if (!newPassword || !confirmPassword) {
            showModal('비밀번호를 모두 입력해주세요.');
            return;
        }
        if (newPassword !== confirmPassword) {
            showModal('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (newPassword.length < 4) {
            showModal('비밀번호는 4자 이상이어야 합니다.');
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    phoneNumber: phoneNumber.replace(/-/g, ''),
                    newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                setIsResetPopupOpen(false);
                showModal('비밀번호 재설정이 완료되었습니다.', () => {
                    navigate('/');
                });
            } else {
                showModal(data.message || '비밀번호 재설정 중 오류가 발생했습니다.');
            }
        } catch (error) {
            showModal('비밀번호 재설정 실패');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center font-['Pretendard']">
            <CommonModal
                isOpen={modal.isOpen}
                type="alert"
                message={modal.message}
                onConfirm={() => {
                    modal.onConfirm();
                    setModal(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Password Reset Popup */}
            {isResetPopupOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-gray-100 transform scale-100 transition-all">
                        <h3 className="text-xl font-bold text-[#003C48] mb-6">새 비밀번호 설정</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-[#003C48]">새 비밀번호</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00BDF8] text-[#003C48]"
                                    placeholder="새 비밀번호 입력"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-[#003C48]">비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00BDF8] text-[#003C48]"
                                    placeholder="비밀번호 다시 입력"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsResetPopupOpen(false)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSubmitReset}
                                    className="flex-1 py-3.5 bg-[#00BDF8] text-white rounded-xl font-bold text-sm hover:bg-[#00ACD8] shadow-lg shadow-[#00BDF8]/20"
                                >
                                    변경하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Navigation */}
            <div className="w-full max-w-sm p-4 mt-2 flex justify-end gap-4 text-sm text-gray-700 font-medium">
                <button onClick={() => navigate('/')} className="hover:text-[#00BDF8]">로그인</button>
                <button onClick={() => navigate('/signup')} className="hover:text-[#00BDF8]">회원가입</button>
            </div>

            <div className="w-full max-w-sm px-6 mt-4 flex flex-col items-center">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/images/main_title.png" alt="Bandicon" className="w-64 mb-2" />
                </div>

                {/* Find Password Card */}
                <div className="w-full bg-white rounded-[2rem] p-8 shadow-[0_0_20px_rgba(0,0,0,0.03)] border border-gray-100">
                    <h2 className="text-[14px] font-bold text-[#003C48] mb-8">비밀번호 찾기</h2>

                    <div className="space-y-6">
                        {/* User ID */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-[#003C48]">아이디</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00BDF8] text-[#003C48]"
                                placeholder="아이디를 입력하세요"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-[#003C48]">전화번호</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setPhoneNumber(value);
                                    }}
                                    readOnly={isVerified}
                                    className={`flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00BDF8] text-[#003C48] ${isVerified ? 'bg-gray-100' : ''}`}
                                    placeholder="01012345678"
                                />
                                <button
                                    onClick={handleGetAuthCode}
                                    disabled={isVerified}
                                    className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border ${isVerified ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {isVerified ? '인증완료' : isSmsSent ? '재발송' : '인증요청'}
                                </button>
                            </div>
                        </div>

                        {/* Auth Code */}
                        {isSmsSent && !isVerified && (
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-[#003C48]">인증번호</label>
                                <div className="flex gap-2 relative">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={authCode}
                                            onChange={(e) => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            maxLength={6}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00BDF8] text-[#003C48]"
                                            placeholder="6자리 숫자"
                                        />
                                        {timer > 0 && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">
                                                {formatTime(timer)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleVerify}
                                        className="px-4 py-2.5 bg-[#00BDF8] text-white rounded-xl text-xs font-bold hover:bg-[#00ACD8] transition-colors"
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reset Button */}
                        <div className="pt-4">
                            <button
                                onClick={async () => {
                                    if (!userId) {
                                        showModal('아이디를 입력해주세요.');
                                        return;
                                    }
                                    try {
                                        const res = await fetch('/api/auth/check-user', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId, phoneNumber: phoneNumber.replace(/-/g, '') })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setIsResetPopupOpen(true);
                                        } else {
                                            showModal(data.message || '사용자 정보를 확인할 수 없습니다.');
                                        }
                                    } catch (error) {
                                        showModal('인증 확인 중 오류가 발생했습니다.');
                                    }
                                }}
                                disabled={!isVerified || !userId}
                                className={`w-full py-4 rounded-2xl font-bold text-[14px] shadow-md transition-all active:scale-95 ${(!isVerified || !userId) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#00BDF8] text-white hover:bg-[#00ACD8] shadow-[#00BDF8]/20'}`}
                            >
                                비밀번호 재설정
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindPasswordPage;
