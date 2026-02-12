import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music2, ClipboardList, Home, Users, Medal } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'freejam', label: '자유합주방', icon: Music2, path: '/main/jam' },
        { id: 'board', label: '게시판', icon: ClipboardList, path: '/main/board' },
        { id: 'home', label: '홈', icon: Home, path: '/main/home' },
        { id: 'clan', label: '클랜', icon: Users, path: '/main/clan' },
        { id: 'membersador', label: '멤버서더', icon: Medal, path: '/main/membersador' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-100 flex justify-around items-center px-2 z-50 pb-safe">
            {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#00B2D2]' : 'text-gray-400'}`}
                    >
                        <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
