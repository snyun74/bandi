import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaChevronLeft, 
    FaSearch, 
    FaMapMarkerAlt, 
    FaPhone, 
    FaExternalLinkAlt, 
    FaGuitar,
    FaDrum,
    FaMicrophone,
    FaHeadphones,
    FaMusic,
    FaVolumeUp,
    FaCompactDisc
} from 'react-icons/fa';

interface StudioDirItem {
    dirNo: number;
    studioNm: string;
    roadAddress?: string;
    jibunAddress?: string;
    telephone?: string;
    categoryNm?: string;
    linkUrl?: string;
    sido?: string;
    sigungu?: string;
    dong?: string;
    useYn: string;
    insDtime: string;
    updDtime?: string;
}

// 상호명 및 카테고리에 기반한 심플 로고 매핑
const getStudioLogoConfig = (studio: StudioDirItem, index: number) => {
    const text = `${studio.studioNm || ''} ${studio.categoryNm || ''}`.toLowerCase();

    if (text.includes('레코딩') || text.includes('녹음') || text.includes('사운드') || text.includes('record')) {
        return {
            icon: <FaMicrophone size={16} />,
            label: 'RECORD',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-700',
            tag: 'text-slate-500'
        };
    }
    if (text.includes('드럼') || text.includes('drum') || text.includes('타악')) {
        return {
            icon: <FaDrum size={16} />,
            label: 'DRUM',
            bg: 'bg-zinc-50',
            border: 'border-zinc-200',
            text: 'text-zinc-700',
            tag: 'text-zinc-500'
        };
    }
    if (text.includes('보컬') || text.includes('피아노') || text.includes('건반') || text.includes('vocal')) {
        return {
            icon: <FaHeadphones size={16} />,
            label: 'VOCAL',
            bg: 'bg-cyan-50/50',
            border: 'border-cyan-200/70',
            text: 'text-[#007A99]',
            tag: 'text-[#0098CC]'
        };
    }
    if (text.includes('라이브') || text.includes('홀') || text.includes('공연') || text.includes('live')) {
        return {
            icon: <FaVolumeUp size={16} />,
            label: 'LIVE',
            bg: 'bg-blue-50/50',
            border: 'border-blue-200/70',
            text: 'text-blue-700',
            tag: 'text-blue-500'
        };
    }
    if (text.includes('기타') || text.includes('guitar') || text.includes('베이스') || text.includes('합주')) {
        return {
            icon: <FaGuitar size={16} />,
            label: 'BAND',
            bg: 'bg-teal-50/50',
            border: 'border-teal-200/70',
            text: 'text-[#003C48]',
            tag: 'text-[#00667C]'
        };
    }

    // 기본 순환 로고
    const fallbacks = [
        { icon: <FaGuitar size={16} />, label: 'STUDIO', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-[#003C48]', tag: 'text-gray-500' },
        { icon: <FaDrum size={16} />, label: 'RHYTHM', bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700', tag: 'text-zinc-500' },
        { icon: <FaHeadphones size={16} />, label: 'SOUND', bg: 'bg-cyan-50/50', border: 'border-cyan-200/70', text: 'text-[#007A99]', tag: 'text-[#0098CC]' },
        { icon: <FaCompactDisc size={16} />, label: 'JAM', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', tag: 'text-slate-500' },
        { icon: <FaMusic size={16} />, label: 'MUSIC', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', tag: 'text-gray-500' },
    ];
    return fallbacks[index % fallbacks.length];
};

// 주요 권역 탭 (전체 / 서울 / 경기 / 인천 1줄 구성)
const REGION_TABS = [
    { label: '전체', query: '' },
    { label: '서울', query: '서울' },
    { label: '경기', query: '경기' },
    { label: '인천', query: '인천' },
];

const JamStudioList: React.FC = () => {
    const navigate = useNavigate();
    const [studios, setStudios] = useState<StudioDirItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedArea, setSelectedArea] = useState<string>('전체');
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchStudios = useCallback(async (kw: string, targetPage: number) => {
        setIsLoading(true);
        try {
            const url = `/api/studios/directory/search?keyword=${encodeURIComponent(kw)}&page=${targetPage}&size=20`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStudios(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setPage(data.number || 0);
            }
        } catch (error) {
            console.error("Failed to fetch studio directory", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 검색어 또는 지역 탭 변경 시 호출
    useEffect(() => {
        const effectiveQuery = searchQuery.trim() !== '' ? searchQuery.trim() : (REGION_TABS.find(a => a.label === selectedArea)?.query || '');
        fetchStudios(effectiveQuery, 0);
    }, [searchQuery, selectedArea, fetchStudios]);

    const handleAreaClick = (areaLabel: string, areaQuery: string) => {
        setSelectedArea(areaLabel);
        setSearchQuery('');
        fetchStudios(areaQuery, 0);
    };

    return (
        <div 
            className="flex flex-col bg-[#F8F9FA] font-['Pretendard']"
            style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + var(--safe-top))',
                bottom: 'calc(var(--nav-offset) + var(--safe-bottom))',
                left: 0,
                right: 0,
                fontFamily: '"Pretendard", sans-serif'
            }}
        >
            {/* Header (고정) */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0 z-20 w-full shadow-xs">
                <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-[#003C48] p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <FaChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-[16px] font-bold text-[#003C48]">합주실 둘러보기</h1>
                        <span className="text-[11px] font-bold bg-[#00BDF8]/10 text-[#00BDF8] px-2 py-0.5 rounded-full">
                            {totalElements}곳
                        </span>
                    </div>
                    <div className="w-8" />
                </div>
            </div>

            {/* Search & Area Filter (고정 - 전체/서울/경기/인천 1줄 그리드) */}
            <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 shrink-0 z-10 w-full shadow-xs">
                <div className="max-w-2xl mx-auto space-y-2.5">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="합주실명, 지역(부산, 대전, 강원 등), 구, 동 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-9 text-xs text-[#003C48] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all font-medium"
                        />
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Region Tabs (깔끔한 1줄 4분할 탭) */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {REGION_TABS.map((area) => {
                            const isActive = selectedArea === area.label && searchQuery.trim() === '';
                            return (
                                <button
                                    key={area.label}
                                    onClick={() => handleAreaClick(area.label, area.query)}
                                    className={`py-2 text-[12px] font-bold rounded-xl transition-all text-center border ${
                                        isActive
                                            ? 'bg-[#003C48] text-white border-[#003C48] shadow-xs'
                                            : 'bg-gray-50 text-gray-600 border-gray-200/80 hover:bg-gray-100'
                                    }`}
                                >
                                    {area.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable Studio List (목록만 독립 스크롤) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-2xl mx-auto w-full space-y-3 pb-20">
                {isLoading && studios.length === 0 ? (
                    <div className="py-24 text-center text-gray-400 text-xs font-medium">
                        전국 합주실 정보를 불러오는 중입니다...
                    </div>
                ) : studios.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 p-8 space-y-2">
                        <span className="text-3xl">🎸</span>
                        <p className="text-gray-500 font-bold text-sm">검색 결과에 맞는 합주실이 없습니다.</p>
                        <p className="text-gray-400 text-xs">다른 지역명이나 상호명으로 검색해 보세요.</p>
                    </div>
                ) : (
                    studios.map((studio, idx) => {
                        const logo = getStudioLogoConfig(studio, idx);

                        return (
                            <div
                                key={studio.dirNo}
                                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs hover:shadow-md hover:border-[#00BDF8]/40 transition-all flex flex-col gap-2.5 group"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Category-based Simple & Clean Studio Logo */}
                                    <div className={`w-12 h-12 rounded-xl ${logo.bg} border ${logo.border} flex flex-col items-center justify-center shrink-0 shadow-xs transition-colors`}>
                                        <div className={logo.text}>
                                            {logo.icon}
                                        </div>
                                        <span className={`text-[8px] font-bold ${logo.tag} tracking-tight mt-0.5`}>
                                            {logo.label}
                                        </span>
                                    </div>

                                    {/* Studio Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-[14px] font-bold text-[#003C48] truncate tracking-tight">
                                                {studio.studioNm}
                                            </h2>
                                            {studio.sigungu && (
                                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                    {studio.sido} {studio.sigungu}
                                                </span>
                                            )}
                                        </div>

                                        {/* Address & Telephone */}
                                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-600">
                                            {studio.roadAddress && (
                                                <p className="flex items-center gap-1 text-gray-700 font-medium truncate">
                                                    <FaMapMarkerAlt size={10} className="text-[#00BDF8] shrink-0" />
                                                    <span className="truncate">{studio.roadAddress}</span>
                                                </p>
                                            )}
                                            {studio.telephone && (
                                                <a 
                                                    href={`tel:${studio.telephone}`}
                                                    className="inline-flex items-center gap-1 text-gray-500 hover:text-[#00BDF8] text-[11px] pt-0.5 transition-colors"
                                                >
                                                    <FaPhone size={9} className="text-gray-400 shrink-0" />
                                                    <span>{studio.telephone}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                                    <div className="text-[10px] text-gray-400 truncate">
                                        {studio.categoryNm || '음악연습실 / 합주실'}
                                    </div>

                                    {studio.linkUrl && (
                                        <a
                                            href={studio.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3.5 py-1.5 bg-[#03C75A] hover:bg-[#02b350] active:scale-95 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                                        >
                                            <span>네이버 플레이스</span>
                                            <FaExternalLinkAlt size={9} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-3 pb-6">
                        <button
                            disabled={page === 0}
                            onClick={() => fetchStudios(searchQuery, page - 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50"
                        >
                            이전
                        </button>
                        <span className="text-xs font-bold text-gray-600 px-2">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => fetchStudios(searchQuery, page + 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JamStudioList;
