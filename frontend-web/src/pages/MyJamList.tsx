import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch } from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';
import SectionTitle from '../components/common/SectionTitle';

interface MyJamItem {
    bnNo: number;
    bnNm: string;
    bnDesc: string;
    bnSongNm: string;
    bnSingerNm: string;
    bnType: 'CLAN' | 'FREE' | 'NORL';
    bnRoleCd: string;
    bnPart: string;
    bnConfFg: string; // 'Y' (Confirmed), 'N' (Recruiting), 'E' (Ended)
    bnImg?: string;
}

const MyJamList: React.FC = () => {
    const navigate = useNavigate();
    const [myJams, setMyJams] = useState<MyJamItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const fetchJams = useCallback((pageNum: number, searchKeyword: string, isNewSearch: boolean) => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        setIsLoading(true);
        const size = 30;
        fetch(`/api/bands/my?userId=${userId}&keyword=${encodeURIComponent(searchKeyword)}&page=${pageNum}&size=${size}`)
            .then(res => res.ok ? res.json() : { content: [], last: true })
            .then(data => {
                if (isNewSearch) {
                    setMyJams(data.content || []);
                } else {
                    setMyJams(prev => [...prev, ...(data.content || [])]);
                }
                setHasMore(!data.last);
            })
            .catch(err => console.error("Failed to fetch jams", err))
            .finally(() => setIsLoading(false));
    }, []);

    // Initial fetch and search fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(keyword);
            setPage(0);
            fetchJams(0, keyword, true);
        }, 500);

        return () => clearTimeout(timer);
    }, [keyword, fetchJams]);

    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchJams(nextPage, searchTerm, false);
        }
    };

    const handleJamClick = (jam: MyJamItem) => {
        if (jam.bnType === 'CLAN') {
            navigate(`/main/clan/jam/room/${jam.bnNo}`);
        } else {
            navigate(`/main/jam/room/${jam.bnNo}`);
        }
    };

    const getRoleColor = (part: string) => {
        if (part?.includes('보컬')) return 'text-[#00BDF8]';
        if (part?.includes('기타')) return 'text-[#FF9F43]';
        if (part?.includes('베이스')) return 'text-[#FF6B6B]';
        if (part?.includes('드럼')) return 'text-[#54C0C0]';
        if (part?.includes('키보드')) return 'text-[#A3CB38]';
        return 'text-gray-500';
    };

    const getStatusInfo = (confFg: string) => {
        switch (confFg) {
            case 'Y': return { label: '확정', style: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
            case 'E': return { label: '종료', style: 'bg-gray-100 text-gray-500 border-gray-200' };
            default: return { label: '등록', style: 'bg-green-50 text-green-600 border-green-100' };
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="text-[#052c42] mr-2">
                    <FaChevronLeft size={24} />
                </button>
                <SectionTitle as="h1" className="!mt-0 !mb-0 flex-1">내 합주</SectionTitle>
            </div>

            <div className="p-4 space-y-4 pb-20">
                {/* Search Bar - Top of the list */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="합주명, 곡 또는 아티스트 검색"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#00BDF8] shadow-sm transition-all"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>

                <div className="flex items-center justify-between mb-0 mt-2">
                    <SectionTitle as="h2" className="!mt-0 !mb-0 text-[14px]">참여 목록</SectionTitle>
                    {searchTerm && (
                        <span className="text-xs text-gray-400">'{searchTerm}' 검색 결과</span>
                    )}
                </div>

                {myJams.length > 0 ? (
                    myJams.map((jam) => {
                        const isEnded = jam.bnConfFg === 'E';
                        const status = getStatusInfo(jam.bnConfFg);
                        return (
                            <div
                                key={jam.bnNo}
                                onClick={() => handleJamClick(jam)}
                                className={`bg-white rounded-xl p-4 flex items-center shadow-sm relative border ${isEnded ? 'bg-gray-50 border-gray-200 opacity-80' : 'border-gray-100'
                                    } cursor-pointer hover:bg-gray-50 transition-colors`}
                            >
                                {/* Thumbnail */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border border-gray-100 overflow-hidden flex-shrink-0 mr-4 ${isEnded ? 'opacity-50 grayscale' : 'bg-white'}`}>
                                    {jam.bnImg ? (
                                        <img src={jam.bnImg} alt={jam.bnNm} className="w-full h-full object-cover" />
                                    ) : (
                                        <DefaultProfile type="jam" iconSize={24} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className={`flex-1 overflow-hidden pr-20 ${isEnded ? 'opacity-70' : ''}`}>
                                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${jam.bnType === 'CLAN'
                                            ? 'bg-blue-50 text-[#00BDF8] border border-blue-100'
                                            : 'bg-gray-100 text-gray-600 border border-gray-100'
                                            }`}>
                                            {jam.bnType === 'CLAN' ? '클랜' : '자유'}
                                        </span>
                                        <SectionTitle as="h3" className="!mt-0 !mb-0 truncate flex-1 min-w-0 font-bold">
                                            {jam.bnNm}
                                        </SectionTitle>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                        <p className="text-gray-600 text-sm truncate flex-1 leading-relaxed">
                                            {jam.bnSongNm} : {jam.bnSingerNm}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Part Name (Top Right) & Status (Bottom Right) */}
                                <div className="absolute top-4 bottom-4 right-4 flex flex-col justify-between items-end text-right">
                                    <span className={`text-xs font-bold ${isEnded ? 'text-gray-400' : getRoleColor(jam.bnPart || '')}`}>
                                        {jam.bnPart || '대기'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${status.style}`}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : !isLoading ? (
                    <div className="text-center text-gray-400 py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="mb-1">참여 중인 합주가 없습니다.</p>
                        {searchTerm && <p className="text-xs">다른 검색어로 시도해 보세요.</p>}
                    </div>
                ) : null}

                {isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00BDF8]"></div>
                    </div>
                )}

                {hasMore && !isLoading && (
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-3 bg-white border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm mt-2"
                    >
                        더보기
                    </button>
                )}
            </div>
        </div>
    );
};

export default MyJamList;
