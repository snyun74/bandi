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
    FaCompactDisc,
    FaCheck
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
    subwayInfo?: string;
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

// 사용자가 캡처로 지정한 순서의 지역 리스트
const REGION_LIST = [
    '전체',
    '합정/홍대',
    '신촌',
    '사당/이수',
    '신도림/영등포구청',
    '망원',
    '상도/중앙대',
    '서울대입구',
    '방배',
    '혜화/성신여대',
    '강남',
    '강동/송파',
    '기타 서울',
    '경기',
    '인천',
    '부산',
    '대구',
    '광주·전남',
    '대전',
    '울산',
    '세종',
    '강원',
    '충북',
    '충남',
    '전북',
    '경북',
    '경남',
    '제주'
];

type SortType = 'LATEST' | 'NAME_ASC' | 'NAME_DESC';

const JamStudioList: React.FC = () => {
    const navigate = useNavigate();
    const [studios, setStudios] = useState<StudioDirItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRegion, setSelectedRegion] = useState<string>('전체');
    const [sortType, setSortType] = useState<SortType>('LATEST');
    const [isRegionModalOpen, setIsRegionModalOpen] = useState<boolean>(false);

    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchStudios = useCallback(async (kw: string, region: string, sort: SortType, targetPage: number) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (kw.trim()) params.append('keyword', kw.trim());
            if (region && region !== '전체') params.append('region', region);
            params.append('sort', sort);
            params.append('page', targetPage.toString());
            params.append('size', '20');

            const res = await fetch(`/api/studios/directory/search?${params.toString()}`);
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

    // 검색어, 지역, 정렬 변경 시 호출
    useEffect(() => {
        fetchStudios(searchQuery, selectedRegion, sortType, 0);
    }, [searchQuery, selectedRegion, sortType, fetchStudios]);

    // 정렬 토글 핸들러: 오름차순(가나다순) <-> 내림차순(역순) 토글
    const handleToggleSort = () => {
        setSortType((prev) => (prev === 'NAME_ASC' ? 'NAME_DESC' : 'NAME_ASC'));
    };

    const getSortLabel = () => {
        if (sortType === 'NAME_DESC') return '내림차순';
        return '오름차순';
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

            {/* Search, Filter & Sort Bar (고정) */}
            <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100 shrink-0 z-10 w-full shadow-xs">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2">
                        {/* 1. 검색 인풋 */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder={selectedRegion !== '전체' ? `[${selectedRegion}] 합주실 검색...` : "합주실명, 구, 동 검색"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-8 text-xs text-[#003C48] placeholder-gray-400 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all font-medium"
                            />
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* 2. 지역 필터링 아이콘 버튼 (캡처 디자인) */}
                        <button
                            onClick={() => setIsRegionModalOpen(true)}
                            title={`지역 필터: ${selectedRegion}`}
                            className={`h-[40px] px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                                selectedRegion !== '전체'
                                    ? 'bg-[#00BDF8]/10 border-[#00BDF8] text-[#0098CC] font-bold'
                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                            }`}
                        >
                            {/* 3단 라인 필터 아이콘 */}
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <line x1="4" y1="7" x2="20" y2="7" strokeLinecap="round" />
                                <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round" />
                                <line x1="10" y1="17" x2="14" y2="17" strokeLinecap="round" />
                            </svg>
                            {selectedRegion !== '전체' && (
                                <span className="text-[11px] max-w-[60px] truncate">{selectedRegion}</span>
                            )}
                        </button>

                        {/* 3. 오름/내림차순 정렬 토글 아이콘 버튼 (캡처 디자인 - 텍스트 없이 아이콘만 표출) */}
                        <button
                            onClick={handleToggleSort}
                            title={`정렬: ${getSortLabel()}`}
                            className="h-[40px] w-[40px] rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all shrink-0 active:scale-95 text-gray-700 hover:text-[#003C48]"
                        >
                            {/* 위아래 정렬 화살표 아이콘 */}
                            <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${sortType === 'NAME_DESC' ? 'rotate-180 text-[#00BDF8]' : 'text-gray-700'}`} 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth={2}
                            >
                                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* 선택된 지역 활성화 태그 */}
                    {selectedRegion !== '전체' && (
                        <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-gray-50">
                            <span className="text-[11px] text-gray-500 font-medium">선택된 지역:</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0098CC] bg-[#00BDF8]/10 px-2 py-0.5 rounded-full">
                                {selectedRegion}
                                <button
                                    onClick={() => setSelectedRegion('전체')}
                                    className="hover:text-red-500 ml-0.5"
                                >
                                    ✕
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Studio List (목록 스크롤) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-2xl mx-auto w-full space-y-3 pb-20">
                {isLoading && studios.length === 0 ? (
                    <div className="py-24 text-center text-gray-400 text-xs font-medium">
                        합주실 정보를 불러오는 중입니다...
                    </div>
                ) : studios.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 p-8 space-y-2">
                        <span className="text-3xl">🎸</span>
                        <p className="text-gray-500 font-bold text-sm">검색 결과에 맞는 합주실이 없습니다.</p>
                        <p className="text-gray-400 text-xs">다른 지역이나 검색어를 선택해 보세요.</p>
                        {selectedRegion !== '전체' && (
                            <button
                                onClick={() => setSelectedRegion('전체')}
                                className="mt-3 px-4 py-1.5 bg-[#00BDF8] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#009bc9]"
                            >
                                전체 지역 보기
                            </button>
                        )}
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

                                        {/* Address, Subway & Telephone */}
                                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-600">
                                            {studio.roadAddress && (
                                                <p className="flex items-center gap-1 text-gray-700 font-medium truncate">
                                                    <FaMapMarkerAlt size={10} className="text-[#00BDF8] shrink-0" />
                                                    <span className="truncate">{studio.roadAddress}</span>
                                                </p>
                                            )}
                                            {studio.subwayInfo && (
                                                <p className="flex items-center gap-1 text-[#007A99] font-semibold truncate">
                                                    <span className="text-[11px] shrink-0 leading-none">🚇</span>
                                                    <span className="truncate">{studio.subwayInfo}</span>
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
                            onClick={() => fetchStudios(searchQuery, selectedRegion, sortType, page - 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50"
                        >
                            이전
                        </button>
                        <span className="text-xs font-bold text-gray-600 px-2">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => fetchStudios(searchQuery, selectedRegion, sortType, page + 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-50"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 지역 선택 바텀시트 모달 (캡처 화면 100% 일치 구현) */}
            {/* ========================================================================= */}
            {isRegionModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center animate-fadeIn"
                    onClick={() => setIsRegionModalOpen(false)}
                >
                    <div 
                        className="bg-white w-full max-w-lg rounded-t-[24px] max-h-[80vh] flex flex-col shadow-2xl animate-slideUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 드래그 핸들 */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />

                        {/* 모달 타이틀 */}
                        <div className="px-5 pb-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
                            <h2 className="text-[18px] font-bold text-[#0B1114]">지역 선택</h2>
                            {selectedRegion !== '전체' && (
                                <button
                                    onClick={() => {
                                        setSelectedRegion('전체');
                                        setIsRegionModalOpen(false);
                                    }}
                                    className="text-xs font-bold text-[#00BDF8] hover:underline"
                                >
                                    초기화
                                </button>
                            )}
                        </div>

                        {/* 지역 리스트 (캡처 순서 그대로 나열) */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 py-1">
                            {REGION_LIST.map((region) => {
                                const isSelected = selectedRegion === region;
                                return (
                                    <div
                                        key={region}
                                        onClick={() => {
                                            setSelectedRegion(region);
                                            setIsRegionModalOpen(false);
                                        }}
                                        className={`px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                                            isSelected 
                                                ? 'bg-cyan-50/50 text-[#0098CC] font-bold' 
                                                : 'text-[#2F2F31] hover:bg-gray-50 active:bg-gray-100'
                                        }`}
                                    >
                                        <span className="text-[15px]">{region}</span>
                                        {isSelected && (
                                            <FaCheck className="text-[#00BDF8]" size={14} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JamStudioList;
