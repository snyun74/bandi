import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

interface ClanData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText: string;
    attachFilePath?: string; // Added field
}

const MyClan: React.FC = () => {
    const navigate = useNavigate();
    const [clans, setClans] = useState<ClanData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyClans = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                // handle no user
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/clans/my-list?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    const mappedData = data.map((item: any) => ({
                        id: item.cnNo,
                        name: item.cnNm,
                        description: item.cnDesc,
                        memberCount: item.userCnt,
                        logoColor: "bg-black", // Default to black as per design
                        logoText: item.cnNm ? item.cnNm.substring(0, 1) : "?",
                        attachFilePath: item.attachFilePath // Mapped field
                    }));
                    setClans(mappedData);
                }
            } catch (error) {
                console.error("Failed to fetch my clans", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyClans();
    }, []);

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">내 클랜</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : clans.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">가입된 클랜이 없습니다.</div>
                ) : (
                    clans.map((clan) => (
                        <div key={clan.id}
                            onClick={() => navigate(`/main/clan/detail/${clan.id}`)}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
                            {/* Logo */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-gray-100 overflow-hidden flex-shrink-0 ${!clan.attachFilePath ? clan.logoColor : 'bg-white'}`}>
                                {clan.attachFilePath ? (
                                    <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-2xl font-bold">{clan.logoText}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="text-[#003C48] text-lg font-bold mb-0.5">{clan.name}</h3>
                                <p className="text-[#003C48] text-[13px] mb-1">{clan.description}</p>
                                <p className="text-[#003C48] text-[12px] font-medium">멤버 : {clan.memberCount}명</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyClan;
