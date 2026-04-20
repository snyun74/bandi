import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import CommonModal from '../common/CommonModal';

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setIsAuthModalOpen(true);
        } else {
            setIsInitialized(true);
        }
    }, []);

    const handleConfirm = () => {
        setIsAuthModalOpen(false);
        navigate('/');
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <CommonModal
                isOpen={isAuthModalOpen}
                type="alert"
                message={"로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다."}
                onConfirm={handleConfirm}
            />

            <Header />

            {/* Content Area with padding for Header and BottomNav */}
            <main className="flex-1 pt-[calc(60px+env(safe-area-inset-top))] pb-[calc(70px+env(safe-area-inset-bottom))]">
                {/* Only render content if authenticated to prevent unnecessary API calls */}
                {isInitialized && <Outlet />}
            </main>

            <BottomNav />
        </div>
    );
};

export default MainLayout;
