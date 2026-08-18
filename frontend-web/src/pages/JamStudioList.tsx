import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaStar, FaMapMarkerAlt, FaEllipsisH } from 'react-icons/fa';
import { getNearbySubway } from '../utils/kakaoSubwayUtil';
import type { SubwayInfo } from '../utils/kakaoSubwayUtil';

interface Attachment {
    attachNo: number;
    filePath: string;
    fileName: string;
}

interface Studio {
    studioNo: number;
    partnerNo: number;
    studioNm: string;
    address: string;
    zipcode: string;
    bigo: string;
    studioStatCd: string;
    attachments: Attachment[];
    lowestPrice: number | null;
    roomSummary: string;
    studioTypeCd: string;
}

const JamStudioList: React.FC = () => {
    const navigate = useNavigate();
    const [studios, setStudios] = useState<Studio[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedFilter, setSelectedFilter] = useState<string>('연습실');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [imageTick, setImageTick] = useState<number>(0);
    // studioNo → 지하철 정보 맵 (카카오 API 비동기 조회 결과 저장)
    const [subwayMap, setSubwayMap] = useState<Map<number, SubwayInfo | null>>(new Map());

    useEffect(() => {
        const fetchStudios = async () => {
            try {
                const response = await fetch('/api/studios/active');
                if (response.ok) {
                    const data = await response.json();
                    setStudios(data);
                } else {
                    console.error('Failed to fetch active studios');
                }
            } catch (error) {
                console.error('Error fetching active studios:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudios();
    }, []);

    // 스튜디오 목록이 로드되면 각 지점 주소로 지하철 정보 비동기 조회
    useEffect(() => {
        if (studios.length === 0) return;
        studios.forEach(async (studio) => {
            if (!studio.address) return;
            const info = await getNearbySubway(studio.address);
            setSubwayMap(prev => new Map(prev).set(studio.studioNo, info));
        });
    }, [studios]);

    // 검색어 및 필터 필터링
    const filteredStudios = studios.filter(studio => {
        // 1. 카테고리 필터 칩 필터링
        if (selectedFilter === '연습실' && studio.studioTypeCd !== 'S') {
            return false;
        }
        if (selectedFilter === '공연장' && studio.studioTypeCd !== 'H') {
            return false;
        }

        // 2. 텍스트 검색 필터링
        const matchesSearch = 
            studio.studioNm.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (studio.address && studio.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (studio.roomSummary && studio.roomSummary.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
    });

    // 이미지 경로 처리: 등록된 이미지가 있으면 맨 마지막에 등록된 이미지 1장 표시, 없으면 디폴트 이미지
    const getStudioImage = (studio: Studio, index: number) => {
        if (studio.attachments && studio.attachments.length > 0) {
            // 맨 마지막에 등록된 이미지 선택
            return studio.attachments[studio.attachments.length - 1].filePath;
        }
        
        // 폴백 목업 이미지 배열
        const fallbacks = [
            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
        ];
        return fallbacks[index % fallbacks.length];
    };


    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full">
                <button onClick={() => navigate(-1)} className="text-[#052c42] shrink-0">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-[#052c42] text-center flex-1">공간 예약</h1>
                <div className="w-5 h-5 shrink-0" /> {/* 좌우 균형 맞추기용 빈 공간 */}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="지역, 연습실, 공연장을 검색해보세요."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-full py-3.5 pl-12 pr-4 text-sm text-[#052c42] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:ring-1 focus:ring-[#00BDF8] transition-all shadow-sm"
                    />
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['연습실', '공연장'].map((filter) => {
                        const isActive = selectedFilter === filter;
                        return (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 border ${
                                    isActive
                                        ? 'bg-[#00BDF8] text-white border-[#00BDF8]'
                                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>

                {/* Studio List */}
                <div className="space-y-4">
                    {isLoading ? (
                        // Skeleton UI while loading
                        Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex gap-4 animate-pulse">
                                <div className="w-28 h-28 bg-gray-200 rounded-2xl shrink-0" />
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/5" />
                                </div>
                            </div>
                        ))
                    ) : filteredStudios.length === 0 ? (
                        <div className="text-center py-16 space-y-2">
                            <span className="text-4xl">🔍</span>
                            <p className="text-gray-400 font-bold text-sm">검색 결과에 맞는 합주실이 없습니다.</p>
                        </div>
                    ) : (
                        filteredStudios.map((studio, index) => {
                            const isFirst = index === 0;
                            const subwayInfo = subwayMap.get(studio.studioNo) ?? null;
                            return (
                                <div
                                    key={studio.studioNo}
                                    onClick={() => navigate(`/main/jam/reservation/studios/${studio.studioNo}`)}
                                    className="bg-white rounded-2xl p-3 shadow-md flex items-center gap-3 transition-all duration-300 active:scale-[0.98] border border-gray-100 hover:shadow-lg cursor-pointer"
                                    style={{ minHeight: '124px' }}
                                >
                                    {/* Thumbnail Image */}
                                    <div 
                                        style={{ width: '100px', height: '100px', minWidth: '100px', minHeight: '100px', maxWidth: '100px', maxHeight: '100px' }} 
                                        className="rounded-2xl overflow-hidden shrink-0 flex-shrink-0 bg-gray-100"
                                    >
                                        <img
                                            src={getStudioImage(studio, index)}
                                            alt={studio.studioNm}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=300&auto=format&fit=crop';
                                            }}
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 self-stretch" style={{ minWidth: 0 }}>
                                        <div className="min-w-0">
                                            <h2 className="text-[14px] font-bold text-[#052c42] truncate leading-tight block w-full">
                                                {studio.studioNm}
                                            </h2>
                                            
                                            {/* Rating */}
                                            <div className="flex items-center gap-1 mt-1 shrink-0">
                                                <FaStar className="text-amber-400" size={11} />
                                                <span className="text-[11px] font-bold text-gray-500">4.8</span>
                                            </div>

                                            {/* Location Pin & Address */}
                                            <div className="flex items-start gap-1 mt-1 min-w-0">
                                                <FaMapMarkerAlt className="text-[#00BDF8]/80 shrink-0 flex-shrink-0 mt-[2px]" size={10} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] text-gray-500 truncate">
                                                        {studio.address || '위치 정보 없음'}
                                                    </span>
                                                    {subwayInfo && (
                                                        <span className="text-[10px] text-[#00BDF8] font-semibold mt-0.5">
                                                            🚇 {subwayInfo.station} 도보 {subwayInfo.minutes}분
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Room Summary */}
                                            {studio.roomSummary && (
                                                <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                                    <span className="text-[10px] shrink-0">🎵</span>
                                                    <span className="text-[11px] text-gray-400 truncate block w-full">
                                                        {studio.roomSummary}
                                                    </span>
                                                </div>
                                            )}
                                        </div>


                                        {/* Price */}
                                        <div className="mt-1.5 shrink-0">
                                            <span className="text-[13px] font-bold text-[#00BDF8] block">
                                                {studio.lowestPrice 
                                                    ? `${studio.lowestPrice.toLocaleString()}원 / 시간`
                                                    : '가격 문의'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default JamStudioList;
