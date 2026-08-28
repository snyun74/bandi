import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const [userName, setUserName] = useState('회원');
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (userId) {
            fetch(`/api/auth/user/name?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.name) {
                        setUserName(data.name);
                    }
                })
                .catch(err => console.error('Failed to fetch user name:', err));

            // Fetch total unread count initially and every 30 seconds
            const fetchUnreadCount = () => {
                fetch(`/api/chat/unread/total?userId=${userId}`)
                    .then(res => res.json())
                    .then(count => setUnreadCount(Number(count)))
                    .catch(err => console.error('Failed to fetch unread count:', err));
            };

            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 7000); // 7초마다 체크
            return () => clearInterval(interval);
        }
    }, [userId]);

    const handleChatClick = () => {
        if (!userId) {
            window.dispatchEvent(new CustomEvent('open-auth-modal', {
                detail: {
                    title: '로그인이 필요한 서비스예요 💬',
                    description: '채팅 및 알림 기능을 이용하시려면\n로그인이 필요합니다.'
                }
            }));
            return;
        }
        navigate('/main/chat/list');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-[calc(var(--header-height)+var(--safe-top))] pt-safe bg-white border-b border-gray-100 flex items-center justify-between pl-4 pr-3 z-50">
            {/* Left: Bandicon Logo */}
            <img
                src="/images/bandicon.png"
                alt="Bandicon"
                className="h-[64px] w-auto object-contain cursor-pointer"
                onClick={() => navigate('/main')}
            />

            {/* Right: Nickname or Login Button & Chat Icon */}
            <div className="flex items-center gap-3">
                {userId ? (
                    <span
                        className="top-nick-name text-[14px] cursor-pointer"
                        onClick={() => navigate('/main/profile')}
                    >
                        {userName}님
                    </span>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="px-3.5 py-1.5 bg-[#00BDF8] text-white rounded-full text-xs font-bold hover:bg-[#00a6dc] active:scale-95 transition-all shadow-xs"
                    >
                        로그인
                    </button>
                )}
                
                <div className="relative cursor-pointer p-1 hover:scale-110 active:scale-95 transition-all flex items-center justify-center mr-1" onClick={handleChatClick}>
                    <Send className="w-[22px] h-[22px] text-[#00BDF8]" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1.5 -right-2 bg-[#FF4B4B] text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 border-2 border-white shadow-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
