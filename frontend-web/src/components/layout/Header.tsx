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
        <header className="fixed top-0 left-0 right-0 h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
            {/* Left: Logo */}
            <img src="/images/bandicon.png" alt="Bandicon" className="h-[24px] w-auto object-contain" />

            {/* Right: Greeting & Chat */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800">{userName}님</span>
                <MessageCircle
                    className="w-6 h-6 text-gray-700 cursor-pointer hover:text-[#00BDF8] transition-colors"
                    onClick={() => navigate('/main/chat/list')}
                />
            </div>
        </header>
    );
};

export default Header;
