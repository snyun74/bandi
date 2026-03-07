import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';

const FindIdPage: React.FC = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [isSmsSent, setIsSmsSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [modal, setModal] = useState({ isOpen: false, message: '', onConfirm: () => { } });

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

    const handleFindId = async () => {
        if (!isVerified) {
            showModal('휴대폰 인증을 먼저 완료해주세요.');
            return;
        }
        const cleanPhone = phoneNumber.replace(/-/g, '');
        try {
            const res = await fetch(`/api/auth/find-id?phoneNumber=${cleanPhone}`);
            const data = await res.json();
            if (res.ok) {
                showModal(`찾으시는 아이디는 [ ${data.userId} ] 입니다.`, () => {
                    navigate('/');
                });
            } else {
                showModal(data.message || '아이디를 찾을 수 없습니다.');
            }
        } catch (error) {
            showModal('아이디 조회 중 오류가 발생했습니다.');
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

            {/* Header Navigation */}
            <div className="w-full max-w-sm p-4 mt-2 flex justify-end gap-4 text-sm text-gray-700 font-medium">
                <button onClick={() => navigate('/')} className="hover:text-[#00BDF8]">로그인</button>
                <button onClick={() => navigate('/signup')} className="hover:text-[#00BDF8]">회원가입</button>
            </div>

            <div className="w-full max-w-sm px-4 mt-4 flex flex-col items-center">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <img src="/images/main_title.png" alt="Bandicon" className="w-64 mb-2" />
                </div>

                {/* Find ID Card */}
                <div className="w-full bg-white rounded-[2rem] p-6 shadow-[0_0_20px_rgba(0,0,0,0.03)] border border-gray-100">
                    <h2 className="text-[15px] font-bold text-[#003C48] mb-8">아이디 찾기</h2>

                    <div className="space-y-6">
                        {/* Phone Number */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-[#003C48]">전화번호</label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setPhoneNumber(value);
                                    }}
                                    readOnly={isVerified}
                                    className={`w-[160px] flex-none px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:border-[#00BDF8] text-[#003C48] ${isVerified ? 'bg-gray-100' : ''}`}
                                    placeholder="01012345678"
                                />
                                <button
                                    onClick={handleGetAuthCode}
                                    disabled={isVerified}
                                    className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border ${isVerified ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-[#003C48] border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {isVerified ? '인증완료' : isSmsSent ? '재발송' : '인증요청'}
                                </button>
                            </div>
                        </div>

                        {/* Auth Code */}
                        {isSmsSent && !isVerified && (
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-[#003C48]">인증번호</label>
                                <div className="flex gap-1.5 relative">
                                    <div className="flex-1 min-w-0 relative">
                                        <input
                                            type="text"
                                            value={authCode}
                                            onChange={(e) => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            maxLength={6}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:border-[#00BDF8] text-[#003C48]"
                                            placeholder="6자리 숫자"
                                        />
                                        {timer > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500">
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

                        {/* Find ID Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleFindId}
                                className="w-full py-4 bg-[#00BDF8] text-white rounded-2xl font-bold text-[14px] shadow-md hover:bg-[#00ACD8] transition-all active:scale-95 shadow-[#00BDF8]/20"
                            >
                                아이디 찾기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindIdPage;
