import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import { FaUnlink } from 'react-icons/fa'; // Fallback icon

interface MyJamItem {
    bnNo: number;
    bnNm: string;
    bnDesc: string;
    bnSongNm: string;
    bnSingerNm: string;
    bnType: 'CLAN' | 'FREE'; // Assuming these types
    bnRoleCd: string; // e.g., 'LEAD', 'MEMBER' - wait, interface might be part name
    bnPart: string; // "보컬", "기타" etc.
    bnConfFg: string; // 'Y' (Confirmed?), 'N', 'E' (Ended)
    bnImg?: string; // Optional image URL
}

const MyJamList: React.FC = () => {
    const navigate = useNavigate();
    const [myJams, setMyJams] = useState<MyJamItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        fetch(`/api/bands/my?userId=${userId}`)
            .then(res => {
                if (res.ok) return res.json();
                return [];
            })
            .then(data => {
                setMyJams(data);
            })
            .catch(err => console.error("Failed to fetch jams", err))
            .finally(() => setIsLoading(false));
    }, []);

    const handleJamClick = (jam: MyJamItem) => {
        if (jam.bnType === 'CLAN') {
            navigate(`/main/clan/jam/room/${jam.bnNo}`);
        } else {
            navigate(`/main/jam/room/${jam.bnNo}`);
        }
    };

    const getRoleColor = (part: string) => {
        if (part?.includes('보컬')) return 'text-[#00BDF8]'; // Blue
        if (part?.includes('기타')) return 'text-[#FF9F43]'; // Orange
        if (part?.includes('베이스')) return 'text-[#FF6B6B]'; // Red/Pink
        if (part?.includes('드럼')) return 'text-[#54C0C0]'; // Teal
        if (part?.includes('키보드')) return 'text-[#A3CB38]'; // Green
        return 'text-gray-500';
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-2">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-lg text-[#003C48] font-bold leading-tight">내 합주</h1>
            </div>

            <div className="p-4 space-y-4">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-10">로딩 중...</p>
                ) : myJams.length > 0 ? (
                    myJams.map((jam) => {
                        const isEnded = jam.bnConfFg === 'E';
                        return (
                            <div
                                key={jam.bnNo}
                                onClick={() => handleJamClick(jam)}
                                className={`bg-white rounded-xl p-4 flex items-center shadow-sm relative border ${isEnded ? 'bg-gray-100 border-gray-200 grayscale opacity-80' : 'border-gray-100'
                                    } cursor-pointer hover:bg-gray-50 transition-colors`}
                            >
                                {/* Thumbnail */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0 mr-4 ${isEnded ? 'opacity-50 grayscale' : 'bg-white'}`}>
                                    {jam.bnImg ? (
                                        <img src={jam.bnImg} alt={jam.bnNm} className="w-full h-full object-cover" />
                                    ) : (
                                        // Placeholder
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                            <FaUnlink size={20} />
                                            <span className="text-[10px] mt-1">미연결</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className={`flex-1 overflow-hidden pr-20 ${isEnded ? 'opacity-60' : ''}`}>
                                    <h3 className="text-[#003C48] text-lg font-bold truncate mb-0.5">
                                        {jam.bnNm}
                                    </h3>
                                    <p className="text-gray-600 text-sm truncate">
                                        {jam.bnSongNm}
                                    </p>
                                    <p className="text-gray-500 text-xs truncate">
                                        : {jam.bnSingerNm}
                                    </p>
                                </div>

                                {/* Right Side: Part Name & Profile Image (Top) */}
                                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                                    <span className={`text-xs font-bold ${isEnded ? 'text-gray-400' : getRoleColor(jam.bnPart || '')}`}>
                                        {jam.bnPart || '대기'}
                                    </span>
                                </div>

                                {/* Right Side: Status (Bottom) - Only for Ended */}
                                {
                                    isEnded && (
                                        <div className="absolute bottom-4 right-4">
                                            <span className="text-xs text-gray-400 font-bold bg-gray-200 px-2 py-1 rounded-md">
                                                합주 종료
                                            </span>
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        참여 중인 합주가 없습니다.
                    </div>
                )}
            </div>
        </div >
    );
};

export default MyJamList;
