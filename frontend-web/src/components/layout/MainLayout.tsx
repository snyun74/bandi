import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import AuthPromptModal from '../common/AuthPromptModal';

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [authModal, setAuthModal] = useState<{
        isOpen: boolean;
        title?: string;
        description?: string;
    }>({
        isOpen: false,
    });

    // 비회원일 경우 메인(/main, /main/home) 외의 다른 페이지 접근 차단 가드
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const isMainHome = location.pathname === '/main' || location.pathname === '/main/' || location.pathname === '/main/home';
        
        if (!userId && !isMainHome) {
            navigate('/main', { replace: true });
            setAuthModal({
                isOpen: true,
                title: '로그인이 필요한 서비스예요 🎵',
                description: '상세 페이지 및 서비스를 이용하시려면\n로그인이 필요합니다.'
            });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        const handleOpenAuthModal = (e: any) => {
            setAuthModal({
                isOpen: true,
                title: e.detail?.title,
                description: e.detail?.description,
            });
        };

        window.addEventListener('open-auth-modal', handleOpenAuthModal);
        return () => window.removeEventListener('open-auth-modal', handleOpenAuthModal);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-white font-['Pretendard']">
            {/* Global Smooth Auth Prompt Modal */}
            <AuthPromptModal
                isOpen={authModal.isOpen}
                onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
                title={authModal.title}
                description={authModal.description}
            />

            <Header />

            {/* Content Area with padding for Header and BottomNav */}
            <main className="flex-1 pt-[calc(var(--header-height)+var(--safe-top))] pb-[calc(var(--nav-offset)+var(--safe-bottom))]">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};

export default MainLayout;
