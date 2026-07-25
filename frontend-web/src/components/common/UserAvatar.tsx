import React, { useState } from 'react';

interface UserAvatarProps {
    profileImagePath?: string | null;
    nickName?: string;
    userId?: string;
    size?: number;      // 픽셀 단위 크기 (기본 36)
    className?: string;
}

/**
 * 프로필 이미지가 있으면 <img> 태그로 표시하고,
 * 없으면 닉네임/아이디의 첫 글자를 보여주는 아바타 컴포넌트
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
    profileImagePath,
    nickName,
    userId,
    size = 36,
    className = '',
}) => {
    const [imgError, setImgError] = useState(false);

    const displayName = nickName || userId || '?';
    const initial = displayName.substring(0, 1).toUpperCase();

    const sizeStyle: React.CSSProperties = {
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
    };

    if (profileImagePath && !imgError) {
        return (
            <img
                src={profileImagePath}
                alt={displayName}
                style={sizeStyle}
                onError={() => setImgError(true)}
                className={`rounded-full object-cover border border-white/30 shadow-md flex-shrink-0 ${className}`}
            />
        );
    }

    // 이미지 없거나 로드 실패 시 이니셜 아바타
    return (
        <div
            style={sizeStyle}
            className={`rounded-full bg-zinc-700 border border-white/30 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${className}`}
        >
            <span style={{ fontSize: Math.max(10, size * 0.38) }}>{initial}</span>
        </div>
    );
};

export default UserAvatar;
