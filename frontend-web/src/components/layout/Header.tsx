import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const [userName, setUserName] = useState('회원');
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
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
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 min-h-safe-top pt-safe bg-white border-b border-gray-100 flex items-center justify-between pl-4 pr-0 z-50">
            {/* Left: Bandicon Logo */}
            <img
                src="/images/bandicon.png"
                alt="Bandicon"
                className="h-[64px] w-auto object-contain cursor-pointer"
                onClick={() => navigate('/main')}
            />

            {/* Right: Nickname & Chat Icon */}
            <div className="flex items-center gap-2">
                <span
                    className="top-nick-name text-[14px]"
                    onClick={() => navigate('/main/profile')}
                >
                    {userName}님
                </span>
                <div className="relative cursor-pointer hover:scale-110 transition-transform" onClick={() => navigate('/main/chat/list')}>
                    <img
                        src="/images/talk_icon.png"
                        alt="Chat"
                        className="w-[57px] h-[57px] object-contain"
                    />
                    {unreadCount > 0 && (
                        <div className="absolute top-[10px] right-[10px] bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
