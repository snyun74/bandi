import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaAd, FaUserShield } from 'react-icons/fa';

const AdminPage: React.FC = () => {
    const navigate = useNavigate();

    const adminMenus = [
        { id: 'banner', label: '배너광고관리', icon: <FaAd size={24} />, path: '/main/admin/banners' },
        { id: 'clan-approve', label: '클랜승인관리', icon: <FaUserShield size={24} />, path: '/main/admin/clans' },
    ];

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-[#003C48] mb-6">관리자 메뉴</h2>

                <div className="grid grid-cols-2 gap-4">
                    {adminMenus.map((menu) => (
                        <button
                            key={menu.id}
                            onClick={() => navigate(menu.path)}
                            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-[#00BDF8]/30 hover:bg-[#00BDF8]/5 transition-all text-[#003C48] group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#00BDF8] group-hover:bg-white transition-colors">
                                {menu.icon}
                            </div>
                            <span className="font-bold text-sm">{menu.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
