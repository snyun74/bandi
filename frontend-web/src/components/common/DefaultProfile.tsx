import React from 'react';
import { FaUsers, FaMusic, FaUser } from 'react-icons/fa';

interface DefaultProfileProps {
    type: 'clan' | 'jam' | 'user';
    className?: string;
    iconSize?: number;
}

const DefaultProfile: React.FC<DefaultProfileProps> = ({ type, className = "", iconSize = 20 }) => {
    const getIcon = () => {
        switch (type) {
            case 'clan':
                return <FaUsers size={iconSize} />;
            case 'jam':
                return <FaMusic size={iconSize} />;
            case 'user':
                return <FaUser size={iconSize} />;
            default:
                return <FaMusic size={iconSize} />;
        }
    };

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
            {getIcon()}
        </div>
    );
};

export default DefaultProfile;
