import React from 'react';
import { FaBellSlash, FaMobileAlt, FaGlobe, FaChevronRight, FaTimes } from 'react-icons/fa';
import { isAppEnvironment } from '../../utils/pushNotification';

interface NotificationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDontShowToday: () => void;
    onNeverShowAgain: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
    isOpen,
    onClose,
    onDontShowToday,
    onNeverShowAgain,
}) => {
    if (!isOpen) return null;

    const isApp = isAppEnvironment();

    return (
        <div 
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
            style={{ fontFamily: '"Pretendard", sans-serif' }}
        >
            <div 
                className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col transform transition-all duration-300 scale-100 animate-in zoom-in-95"
            >
                {/* Header Background Accent */}
                <div className="relative pt-8 pb-5 px-6 text-center bg-gradient-to-b from-sky-50/80 to-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="닫기"
                    >
                        <FaTimes size={16} />
                    </button>

                    {/* Bell Icon with Subtle Glow */}
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00BDF8] to-[#008BE8] flex items-center justify-center text-white shadow-lg shadow-[#00BDF8]/30 mb-4 animate-bounce-subtle">
                        <FaBellSlash size={26} />
                    </div>

                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-[#008BE8] text-[11px] font-semibold mb-2">
                        <span>알림 권한 안내</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        밴디콘 알림을 켜주세요
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed break-keep">
                        합주 일정, 새로운 채팅, 클랜 및 공지 소식을<br />
                        실시간으로 안전하게 받아보실 수 있습니다.
                    </p>
                </div>

                {/* Instruction Card */}
                <div className="px-6 py-4">
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-[13px]">
                        <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                            {isApp ? (
                                <>
                                    <FaMobileAlt className="text-[#00BDF8] text-[15px]" />
                                    <span>스마트폰 설정 방법</span>
                                </>
                            ) : (
                                <>
                                    <FaGlobe className="text-[#00BDF8] text-[15px]" />
                                    <span>브라우저 설정 방법</span>
                                </>
                            )}
                        </div>

                        {isApp ? (
                            <ol className="space-y-1.5 text-slate-600 leading-snug pl-1">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-[#00BDF8] font-bold">1.</span>
                                    <span>스마트폰 <strong>[설정]</strong> 앱 열기</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-[#00BDF8] font-bold">2.</span>
                                    <span><strong>[애플리케이션(앱)]</strong> → <strong>[밴디콘]</strong> 선택</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-[#00BDF8] font-bold">3.</span>
                                    <span><strong>[알림]</strong> 메뉴에서 <strong>'알림 허용'</strong> 활성화</span>
                                </li>
                            </ol>
                        ) : (
                            <p className="text-slate-600 leading-relaxed">
                                브라우저 주소창 좌측의 <strong>설정(자물쇠) 아이콘</strong>을 누른 후, <strong>[알림]</strong> 권한을 <strong>'허용'</strong>으로 변경해 주세요.
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Action Button */}
                <div className="px-6 pb-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 px-4 bg-[#00BDF8] hover:bg-[#00a6da] text-white rounded-xl font-bold text-[15px] shadow-md shadow-[#00BDF8]/25 active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                        <span>확인 / 닫기</span>
                    </button>
                </div>

                {/* Footer Sub-actions */}
                <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-center gap-3 text-[12px] text-gray-500">
                    <button
                        onClick={onDontShowToday}
                        className="hover:text-gray-800 transition-colors py-1 px-1.5 font-medium underline-offset-2 hover:underline"
                    >
                        오늘 하루 그만 보기
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={onNeverShowAgain}
                        className="hover:text-gray-800 transition-colors py-1 px-1.5 font-medium underline-offset-2 hover:underline"
                    >
                        다시 보지 않기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationPermissionModal;
