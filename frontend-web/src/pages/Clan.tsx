import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface ClanData {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    logoColor: string;
    logoText?: string;
    attachFilePath?: string; // Added field
}

import CommonModal from '../components/common/CommonModal';

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
                    attachFilePath: item.attachFilePath // Mapped field
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
            showAlert('클랜명을 입력해 주세요');
            return;
        }
        fetchClans(searchTerm);
    };

    return (
        <div className="p-4 pb-20" style={{ fontFamily: '"Jua", sans-serif' }}>
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">클랜</h2>
                <button
                    onClick={() => navigate('/main/clan/create')}
                    className="bg-[#00BDF8] text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm"
                >
                    클랜 생성
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00BDF8] text-lg">
                        <FaSearch />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="클랜 명으로 검색"
                        className="w-full pl-10 pr-4 py-3 border border-[#00BDF8] rounded-xl text-base outline-none focus:ring-1 focus:ring-[#00BDF8] shadow-sm"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-[#00BDF8] text-white px-6 rounded-xl font-bold hover:bg-[#00ACD8] transition-colors"
                >
                    조회
                </button>
            </div>

            {/* Clan List */}
            <div className="space-y-4">
                {clans.map((clan) => (
                    <div key={clan.id}
                        onClick={() => handleClanClick(clan.id)}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        {/* Logo / Profile Image */}
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
                            <p className="text-gray-600 text-[13px] mb-1">{clan.description}</p>
                            <p className="text-[#003C48] text-[12px] font-medium">멤버 : {clan.memberCount}명</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Clan;
