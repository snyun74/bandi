import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaAd, FaUserShield, FaHeadset } from 'react-icons/fa';

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState<{ pendingClans: number; unansweredQas: number }>({
        pendingClans: 0,
        unansweredQas: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/admin/clans/dashboard/counts');
                if (res.ok) {
                    const data = await res.json();
                    setCounts(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin dashboard counts", error);
            }
        };
        fetchCounts();
    }, []);

    const adminMenus = [
        { id: 'banner', label: '배너광고관리', icon: <FaAd size={24} />, path: '/main/admin/banners' },
        { id: 'clan-approve', label: '클랜승인관리', icon: <FaUserShield size={24} />, path: '/main/admin/clans', count: counts.pendingClans },
        { id: 'qa', label: '고객센터관리', icon: <FaHeadset size={24} />, path: '/main/admin/qa', count: counts.unansweredQas },
    ];

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <div className="p-6">
                <h2 className="body-room-title mb-6">관리자 메뉴</h2>

                <div className="grid grid-cols-2 gap-4">
                    {adminMenus.map((menu) => (
                        <button
                            key={menu.id}
                            onClick={() => navigate(menu.path)}
                            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-[#00BDF8]/30 hover:bg-[#00BDF8]/5 transition-all text-[#003C48] group relative"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#00BDF8] group-hover:bg-white transition-colors relative">
                                {menu.icon}
                                {menu.count !== undefined && menu.count > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] border-2 border-white animate-bounce-subtle">
                                        {menu.count > 99 ? '99+' : menu.count}
                                    </div>
                                )}
                            </div>
                            <span className="body-room-title !mt-0">{menu.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
