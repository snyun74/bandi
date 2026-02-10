import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const MainLayout: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Header />

            {/* Content Area with padding for Header and BottomNav */}
            <main className="flex-1 overflow-y-auto pt-[50px] pb-[70px]">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};

export default MainLayout;
