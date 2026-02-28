import React from 'react';

interface SectionTitleProps {
    children: React.ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Unified Section Title Component
 * - Font Size: 14px
 * - Font Weight: 700 (Bold)
 * - Color: #052c42
 * - Default Margin: Top 10px, Bottom 12px
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ children, className = '', as: Component = 'h3' }) => {
    return (
        <Component
            className={`text-[14px] font-[700] text-[#052c42] mt-[10px] ${className}`}
            style={{ fontFamily: '"Pretendard", sans-serif' }}
        >
            {children}
        </Component>
    );
};

export default SectionTitle;
