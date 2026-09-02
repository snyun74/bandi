import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DefaultProfile from '../components/common/DefaultProfile';
import CommonModal from '../components/common/CommonModal';
import SectionTitle from '../components/common/SectionTitle';

interface ClanData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText?: string;
    attachFilePath?: string;
}

const Clan: React.FC = () => {
    const navigate = useNavigate();

    const [clans, setClans] = React.useState<ClanData[]>([]);
    const [myClanIds, setMyClanIds] = React.useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = React.useState('');

    // Modal State
    const [modal, setModal] = React.useState({
        isOpen: false,
        type: 'alert' as 'alert' | 'confirm',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message: string) => {
        setModal({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    const fetchClans = (name?: string) => {
        const url = name ? `/api/clans?name=${encodeURIComponent(name)}` : '/api/clans';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const mappedData = data.map((item: any) => ({
                    id: item.cnNo,
                    name: item.cnNm,
                    description: item.cnDesc,
                    memberCount: item.userCnt,
                    logoColor: "bg-gray-200",
                    logoText: item.cnNm ? item.cnNm.substring(0, 1) : "?",
                    attachFilePath: item.attachFilePath
                }));
                setClans(mappedData);
            })
            .catch(err => console.error('Failed to fetch clans:', err));
    };

    const fetchMyClans = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch(`/api/clans/my-list?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const myIds = new Set<number>(data.map((item: any) => item.cnNo as number));
                setMyClanIds(myIds);
            }
        } catch (error) {
            console.error("Failed to fetch my clans", error);
        }
    };

    React.useEffect(() => {
        fetchClans();
        fetchMyClans();
    }, []);

    const handleClanClick = (clanId: number) => {
        if (myClanIds.has(clanId)) {
            navigate(`/main/clan/detail/${clanId}`);
        } else {
            navigate(`/main/clan/intro/${clanId}`);
        }
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            fetchClans();
            return;
        }
        fetchClans(searchTerm);
    };

    return (
        <div 
            className="flex flex-col bg-[#F7F9FC] font-['Pretendard']"
            style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + var(--safe-top))',
                bottom: 'calc(var(--nav-offset) + var(--safe-bottom))',
                left: 0,
                right: 0,
                fontFamily: '"Pretendard", sans-serif'
            }}
        >
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />

            {/* Header & Search Bar (고정 영역) */}
            <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 shrink-0 z-10 w-full shadow-2xs">
                <div className="max-w-2xl mx-auto space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <SectionTitle as="h2" className="!mt-0 !mb-0 text-[18px] font-bold text-[#003C48]">
                            클랜
                        </SectionTitle>
                        <button
                            onClick={() => navigate('/main/clan/create')}
                            className="bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-[12px] font-bold shadow-xs transition-all cursor-pointer"
                        >
                            클랜 생성
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00BDF8]">
                                <FaSearch size={14} />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="클랜 명으로 검색"
                                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:bg-white focus:border-[#00BDF8] transition-all"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); fetchClans(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-[#00BDF8] hover:bg-[#00a8e0] active:scale-95 text-white px-4 py-2 rounded-xl font-bold text-[13px] transition-all cursor-pointer shrink-0 shadow-xs"
                        >
                            조회
                        </button>
                    </div>
                </div>
            </div>

            {/* Clan List (독립 스크롤 영역) */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 w-full">
                <div className="max-w-2xl mx-auto space-y-3 pb-16">
                    {clans.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 space-y-2 shadow-xs">
                            <span className="text-3xl">👥</span>
                            <p className="text-sm font-bold text-gray-600">등록된 클랜이 없습니다.</p>
                            <p className="text-xs text-gray-400">새로운 클랜을 개설해 보세요!</p>
                        </div>
                    ) : (
                        clans.map((clan) => (
                            <div 
                                key={clan.id}
                                onClick={() => handleClanClick(clan.id)}
                                className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-3.5 cursor-pointer hover:bg-gray-50/80 hover:border-[#00BDF8]/30 transition-all group"
                            >
                                {/* Logo / Profile Image */}
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden shrink-0 bg-gray-50 shadow-xs group-hover:scale-105 transition-transform">
                                    {clan.attachFilePath ? (
                                        <img src={clan.attachFilePath} alt={clan.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <DefaultProfile type="clan" iconSize={22} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[15px] font-bold text-[#003C48] truncate">{clan.name}</h3>
                                    </div>
                                    <p className="text-gray-500 text-[12px] truncate mt-1">{clan.description || '클랜 소개글이 없습니다.'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Clan;
