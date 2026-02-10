import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaPlusCircle } from 'react-icons/fa';

import CommonModal from '../components/common/CommonModal';

interface FriendSearchResult {
    id: string; // Changed to string to match userId in backend
    name: string;
    nickname?: string;
    profileUrl?: string;
    isAdded?: boolean;
}

const FriendAdd: React.FC = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: '',
        onConfirm: () => { },
    });

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleSearch = async () => {
        if (!searchText.trim()) {
            setSearchResults([]); // Clear results if search text is empty
            setHasSearched(true); // Indicate a search attempt was made, even if empty
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '로그인이 필요합니다.',
                onConfirm: closeModal,
            });
            setSearchResults([]);
            setHasSearched(true);
            return;
        }

        try {
            const response = await fetch(`/api/friends/search?keyword=${encodeURIComponent(searchText)}&userId=${userId}`);
            if (response.ok) {
                const data = await response.json();

                // Map API response to UI model
                const results: FriendSearchResult[] = data.map((user: any) => ({
                    id: user.userId, // Using userId as id
                    name: user.userNm,
                    nickname: user.userNickNm, // Assuming nickname field exists based on previous context
                    // profileUrl: user.profileUrl 
                }));

                setSearchResults(results);
            } else {
                setSearchResults([]); // Clear results on non-ok response
            }
        } catch (error) {
            console.error("Search failed", error);
            setSearchResults([]); // Clear results on error
        }
        setHasSearched(true); // Set hasSearched to true after the search attempt
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAddFriend = async (friendUserId: string) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '로그인이 필요합니다.',
                onConfirm: closeModal,
            });
            return;
        }

        try {
            const response = await fetch('/api/friends/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    friendUserId: friendUserId,
                }),
            });

            if (response.ok) {
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: '친구 요청을 보냈습니다.',
                    onConfirm: closeModal,
                });
            } else if (response.status === 409) {
                const errorMsg = await response.text();
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: errorMsg || '이미 친구이거나 요청 중입니다.',
                    onConfirm: closeModal,
                });
            } else {
                setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    message: '친구 요청 실패',
                    onConfirm: closeModal,
                });
            }
        } catch (error) {
            console.error("Friend request failed", error);
            setModalConfig({
                isOpen: true,
                type: 'alert',
                message: '친구 요청 중 오류가 발생했습니다.',
                onConfirm: closeModal,
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />

            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-200">
                <button onClick={() => navigate(-1)} className="text-[#003C48] mr-4">
                    <FaChevronLeft size={22} />
                </button>
                <h1 className="text-xl font-bold text-[#003C48]">친구 추가</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00BDF8]" />
                    <input
                        type="text"
                        placeholder="친구 검색 (이름 또는 닉네임)"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#00BDF8] focus:outline-none focus:ring-1 focus:ring-[#00BDF8] text-sm"
                    />
                </div>

                {/* Search Results */}
                <div className="space-y-4">
                    {hasSearched ? (
                        searchResults.length > 0 ? (
                            searchResults.map((result) => (
                                <div key={result.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-[#003C48] flex items-center justify-center text-[#003C48]">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[#003C48] font-bold text-sm">{result.nickname || result.name}</span>
                                            {result.nickname && <span className="text-gray-400 text-xs">{result.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAddFriend(result.id)}
                                            className="text-[#003C48] hover:text-[#00BDF8] transition-colors"
                                        >
                                            <FaPlusCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10">검색 결과가 없습니다.</div>
                        )
                    ) : (
                        <div className="text-center text-gray-400 py-10 text-sm">친구의 닉네임 또는 이름을 검색해보세요.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendAdd;
