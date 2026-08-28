import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaStar, FaMapMarkerAlt, FaUsers, FaChevronRight, FaChevronLeft as FaChevronLeftIcon } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import { getNearbySubway } from '../utils/kakaoSubwayUtil';
import type { SubwayInfo } from '../utils/kakaoSubwayUtil';

interface Attachment {
    attachNo: number;
    filePath: string;
    fileName: string;
}

interface RoomDto {
    roomNo: number;
    studioNo: number;
    roomNm: string;
    hourBaseUprice: number | null;
    currentUprice?: number | null;
    discountRate?: number | null;
    capacityCnt: number | null;
    equipmentInfo: string | null;
    roomStatCd: string;
    attachments: Attachment[];
}

interface StudioDetailDto {
    studioNo: number;
    partnerNo: number;
    studioNm: string;
    address: string;
    zipcode: string;
    bigo: string;
    studioStatCd: string;
    studioTypeCd: string;
    attachments: Attachment[];
    rooms: RoomDto[];
}

// 설비 정보 문자열에서 태그 배열로 파싱
const parseEquipmentTags = (equipmentInfo: string | null): string[] => {
    if (!equipmentInfo) return [];
    return equipmentInfo
        .split(/[,·\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, 8); // 최대 8개만 표시
};

// 지점 bigo에서 전체 편의시설 태그 추출
const parseStudioTags = (bigo: string | null): string[] => {
    if (!bigo) return [];
    return bigo
        .split(/[,·\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, 10);
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop';

const JamStudioDetail: React.FC = () => {
    const navigate = useNavigate();
    const { studioNo } = useParams<{ studioNo: string }>();
    const [studio, setStudio] = useState<StudioDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [subwayInfo, setSubwayInfo] = useState<SubwayInfo | null>(null);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        if (!studioNo) return;
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/studios/${studioNo}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudio(data);
                }
            } catch (e) {
                console.error('Failed to fetch studio detail', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [studioNo]);

    const images = studio?.attachments && studio.attachments.length > 0
        ? studio.attachments.map(a => a.filePath)
        : [FALLBACK_IMG];

    const goNextImage = () => setCurrentImageIndex(prev => (prev + 1) % images.length);
    const goPrevImage = () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            diff > 0 ? goNextImage() : goPrevImage();
        }
        touchStartX.current = null;
    };

    // 지점 데이터 로드 후 카카오 API로 근보 지하철역 비동기 조회
    useEffect(() => {
        if (!studio?.address) return;
        getNearbySubway(studio.address).then(setSubwayInfo);
    }, [studio]);

    const studiaTags = parseStudioTags(studio?.bigo ?? null);
    const hasRooms = studio?.rooms && studio.rooms.length > 0;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-gray-50 animate-pulse font-['Pretendard']">
                <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm">
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                    <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
                </div>
                <div className="w-full h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                    <div className="h-7 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="flex gap-2">
                        {[1,2,3].map(i => <div key={i} className="h-7 w-16 bg-gray-200 rounded-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!studio) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-gray-50 font-['Pretendard']">
                <span className="text-4xl mb-3">😢</span>
                <p className="text-gray-400 font-bold">지점 정보를 불러올 수 없습니다.</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-[#00BDF8] text-white rounded-full text-sm font-bold">
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col bg-gray-50 font-['Pretendard']"
            style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + var(--safe-top))',
                bottom: 'calc(var(--nav-offset) + var(--safe-bottom))',
                left: 0,
                right: 0,
            }}
        >
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20 w-full">
                <button onClick={() => navigate(-1)} className="text-[#052c42] shrink-0">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-base font-bold text-[#052c42] text-center flex-1 truncate px-2">공간 상세</h1>
                <div className="w-5 h-5 shrink-0" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0">

                {/* Image Carousel */}
                <div className="px-4 pt-4">
                    <div
                        className="relative w-full bg-gray-200 overflow-hidden rounded-3xl"
                        style={{ height: '240px' }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            key={currentImageIndex}
                            src={images[currentImageIndex]}
                            alt={studio.studioNm}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        />

                        {/* 좌/우 화살표 버튼 (이미지 2장 이상일 때만) */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={goPrevImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 transition-all z-10"
                                >
                                    <FaChevronLeftIcon size={12} />
                                </button>
                                <button
                                    onClick={goNextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 transition-all z-10"
                                >
                                    <FaChevronRight size={12} />
                                </button>

                                {/* 페이지 인디케이터 */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`rounded-full transition-all duration-300 ${
                                                idx === currentImageIndex
                                                    ? 'w-5 h-2 bg-white'
                                                    : 'w-2 h-2 bg-white/50'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* 이미지 개수 배지 */}
                                <div className="absolute top-3 right-3 bg-black/50 text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Studio Info */}
                <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
                    {/* 지점 유형 뱃지 */}
                    <div className="mb-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            studio.studioTypeCd === 'H'
                                ? 'bg-[#003C48] text-white'
                                : 'bg-[#00BDF8]/10 text-[#00BDF8]'
                        }`}>
                            {studio.studioTypeCd === 'H' ? '🎤 공연장' : '🎸 연습실'}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-[#052c42] leading-tight">{studio.studioNm}</h2>

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mt-2">
                        <FaStar className="text-amber-400" size={12} />
                        <span className="text-[12px] font-bold text-gray-500">4.8</span>
                    </div>

                    {/* 주소 + 지하철 정보 */}
                    {studio.address && (
                        <div className="flex items-start gap-1.5 mt-2">
                            <FaMapMarkerAlt className="text-[#00BDF8]/70 shrink-0 mt-0.5" size={11} />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[12px] text-gray-500 leading-snug">{studio.address}</span>
                                {subwayInfo && (
                                    <span className="text-[11px] font-semibold text-[#00BDF8]">
                                        🚇 {subwayInfo.station} 도보 {subwayInfo.minutes}분
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 편의시설 태그 */}
                    {studiaTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {studiaTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* bigo가 태그 형식이 아닌 순수 설명 텍스트인 경우만 표시 (태그와 중복 방지) */}
                    {studiaTags.length === 0 && studio.bigo && (
                        <p className="text-[12px] text-gray-500 mt-3 leading-relaxed">{studio.bigo}</p>
                    )}
                </div>

                {/* Room List Section */}
                <div className="px-4 pt-5 pb-4">
                    <h3 className="text-[14px] font-bold text-[#052c42] mb-3 flex items-center gap-2">
                        <MdMusicNote className="text-[#00BDF8]" size={16} />
                        룸 목록
                    </h3>

                    {!hasRooms ? (
                        /* 룸 없음 Empty State */
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 flex flex-col items-center justify-center gap-2 shadow-sm">
                            <span className="text-4xl">🎵</span>
                            <p className="text-[13px] font-bold text-gray-400">등록된 룸이 없습니다.</p>
                            <p className="text-[11px] text-gray-300">아직 룸 정보가 준비 중입니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studio.rooms.map((room) => {
                                const tags = parseEquipmentTags(room.equipmentInfo);
                                const roomImg = room.attachments && room.attachments.length > 0
                                    ? room.attachments[0].filePath
                                    : null;

                                return (
                                    <div
                                        key={room.roomNo}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                                    >
                                        {/* 룸 이미지 (있을 때만) */}
                                        {roomImg && (
                                            <div className="w-full h-36 overflow-hidden">
                                                <img
                                                    src={roomImg}
                                                    alt={room.roomNm}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* 룸 헤더 */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="text-[14px] font-bold text-[#052c42] leading-tight">
                                                        {room.roomNm}
                                                    </h4>
                                                </div>
                                                {/* 최대 인원 (우측에만 표시) */}
                                                {room.capacityCnt && (
                                                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                                                        <FaUsers size={12} />
                                                        <span className="text-[12px] font-medium">{room.capacityCnt}명</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 장비 태그 */}
                                            {tags.length > 0 && (
                                                <p className="text-[12px] text-gray-500 mt-2 leading-snug">
                                                    {tags.join(' · ')}
                                                </p>
                                            )}

                                            {/* 가격 + 즉시예약 */}
                                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    {room.discountRate && room.discountRate > 0 ? (
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="text-[12px] text-gray-400 line-through">
                                                                {room.hourBaseUprice?.toLocaleString()}원
                                                            </span>
                                                            <span className="text-[12px] font-bold text-[#FF4B4B]">
                                                                {room.discountRate}% 할인중
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                    <span className="text-[16px] font-bold text-[#00BDF8]">
                                                        {(room.currentUprice ?? room.hourBaseUprice)
                                                            ? `${(room.currentUprice ?? room.hourBaseUprice)!.toLocaleString()}원 / 시간`
                                                            : '가격 문의'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/main/jam/reservation/studios/${studioNo}/rooms/${room.roomNo}/book`)}
                                                    className="text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 active:scale-95 px-3.5 py-1.5 rounded-full transition-all border border-emerald-200 shadow-sm shrink-0"
                                                >
                                                    즉시예약
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JamStudioDetail;
