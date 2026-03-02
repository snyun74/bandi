import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const [userName, setUserName] = useState('회원');
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
        }
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-gray-100 flex items-center justify-between pl-4 pr-0 z-50">
            {/* Left: Bandicon Logo */}
            <img
                src="/images/bandicon.png"
                alt="Bandicon"
                className="h-[42px] max-h-[80%] w-auto object-contain cursor-pointer"
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
                <img
                    src="/images/talk_icon.png"
                    alt="Chat"
                    className="w-[40px] h-[40px] max-h-[80%] object-contain cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => navigate('/main/chat/list')}
                />
            </div>
        </header>
    );
};

export default Header;
