import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMusic, FaTimes } from 'react-icons/fa';

interface AuthPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
    isOpen,
    onClose,
    title = "로그인이 필요한 서비스예요 🎵",
    description = "밴디에서 다양한 합주에 참여하고\n음악 친구들과 실시간으로 소통해 보세요!"
}) => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            const timer = setTimeout(() => setAnimate(true), 20);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible) return null;

    const handleGoLogin = () => {
        onClose();
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with fade animation */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
                    animate ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Modal Card with scale and slide animation */}
            <div
                className={`relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-out transform ${
                    animate ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                } font-['Pretendard'] text-center`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FaTimes size={16} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-[#00BDF8]/20 to-[#052c42]/10 rounded-2xl flex items-center justify-center text-[#00BDF8]">
                    <FaMusic size={28} className="animate-bounce-subtle" />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[#052c42] mb-2 leading-snug">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 whitespace-pre-line mb-6 leading-relaxed">
                    {description}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <button
                        onClick={handleGoLogin}
                        className="w-full py-3.5 bg-[#00BDF8] hover:bg-[#00a6dc] active:scale-[0.98] text-white rounded-2xl text-sm font-bold shadow-md shadow-[#00BDF8]/20 transition-all"
                    >
                        로그인 / 회원가입 하러가기
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        다음에 할게요 (둘러보기)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPromptModal;
