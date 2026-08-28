import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCheckCircle } from 'react-icons/fa';

interface RoomPrice {
    priceNo: number;
    roomNo: number;
    dayOfWeek: number; // 0=일, 1=월, ..., 6=토
    sttTime: string;   // "1000"
    endTime: string;   // "2200"
    timeUprice: number;
    priceStatCd: string;
}

interface Reservation {
    resvNo: number;
    roomNo: number;
    userId: string;
    useDate: string;   // "20260820"
    sttTime: string;   // "1400"
    endTime: string;   // "1600"
    resvStatFg: string;
}

interface RoomScheduleData {
    roomNo: number;
    studioNo: number;
    roomNm: string;
    studioNm: string;
    hourBaseUprice: number | null;
    capacityCnt: number | null;
    equipmentInfo: string | null;
    prices: RoomPrice[];
    reservations: Reservation[];
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const JamRoomBook: React.FC = () => {
    const navigate = useNavigate();
    const { studioNo, roomNo } = useParams<{ studioNo: string; roomNo: string }>();

    const today = useMemo(() => new Date(), []);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState<string>(''); // "YYYYMMDD"
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // ["1800", "1900"]

    const [scheduleData, setScheduleData] = useState<RoomScheduleData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const timeScrollRef = useRef<HTMLDivElement>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1 ~ 12
    const yearMonthStr = `${currentYear}${String(currentMonth).padStart(2, '0')}`;

    // 초기 날짜 선택: 오늘 날짜
    useEffect(() => {
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setSelectedDateStr(`${y}${m}${d}`);
    }, [today]);

    // 월별 스케줄 및 예약 현황 조회
    useEffect(() => {
        if (!roomNo) return;
        const fetchSchedule = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/studios/rooms/${roomNo}/schedule?yearMonth=${yearMonthStr}`);
                if (res.ok) {
                    const data: RoomScheduleData = await res.json();
                    setScheduleData(data);
                } else {
                    console.error('Failed to fetch room schedule');
                }
            } catch (err) {
                console.error('Error fetching schedule:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchedule();
    }, [roomNo, yearMonthStr]);

    // 날짜 변경 시 선택된 시간 초기화
    const handleDateSelect = (dateStr: string) => {
        setSelectedDateStr(dateStr);
        setSelectedSlots([]);
    };

    // 이전 달 / 다음 달 이동
    const handlePrevMonth = () => {
        const newDate = new Date(currentYear, currentMonth - 2, 1);
        setCurrentDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentYear, currentMonth, 1);
        setCurrentDate(newDate);
    };

    // 해당 월의 캘린더 날짜 배열 생성
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

        const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
        const totalDays = lastDayOfMonth.getDate();

        const days: ({
            dateNumber: number;
            dateStr: string;
            dayOfWeek: number;
            isCurrentMonth: boolean;
            isPast: boolean;
            isFullyBooked: boolean;
        } | null)[] = [];

        // 빈 칸 (이전 달 날짜 패딩)
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const currentHour = new Date().getHours();

        for (let d = 1; d <= totalDays; d++) {
            const dayDate = new Date(currentYear, currentMonth - 1, d);
            const dateStr = `${currentYear}${String(currentMonth).padStart(2, '0')}${String(d).padStart(2, '0')}`;
            const dayOfWeek = dayDate.getDay();
            const isPast = dayDate.getTime() < todayZero;

            // 요일별 오픈 시간대 확인
            const dayPrices = scheduleData?.prices?.filter(p => p.dayOfWeek === dayOfWeek) || [];
            let startHour = 9;
            let endHour = 22;

            if (dayPrices.length > 0) {
                const minPriceHour = Math.min(...dayPrices.map(p => parseInt(p.sttTime.substring(0, 2), 10)));
                const maxPriceHour = Math.max(...dayPrices.map(p => parseInt(p.endTime.substring(0, 2), 10)));
                startHour = Math.min(9, minPriceHour);
                endHour = Math.max(22, maxPriceHour);
            }

            const totalSlotsCount = Math.max(0, endHour - startHour);

            // 해당 날짜의 예약 확인
            const dayReservations = scheduleData?.reservations?.filter(r => r.useDate === dateStr) || [];
            let unavailableCount = 0;
            const isToday = dateStr === todayStr;

            for (let h = startHour; h < endHour; h++) {
                const slotKey = String(h).padStart(2, '0') + '00';
                const isBooked = dayReservations.some(r => {
                    const rStt = parseInt(r.sttTime, 10);
                    const rEnd = parseInt(r.endTime, 10);
                    const sTime = parseInt(slotKey, 10);
                    return sTime >= rStt && sTime < rEnd;
                });
                const isPastTime = isToday && (h <= currentHour);
                if (isBooked || isPastTime) unavailableCount++;
            }

            const isFullyBooked = totalSlotsCount > 0 && unavailableCount >= totalSlotsCount;

            days.push({
                dateNumber: d,
                dateStr,
                dayOfWeek,
                isCurrentMonth: true,
                isPast,
                isFullyBooked
            });
        }

        return days;
    }, [currentYear, currentMonth, today, scheduleData]);

    // 선택된 날짜의 요일 및 운영 시간대 슬롯 생성
    const availableSlots = useMemo(() => {
        if (!selectedDateStr) return [];

        const y = parseInt(selectedDateStr.substring(0, 4), 10);
        const m = parseInt(selectedDateStr.substring(4, 6), 10) - 1;
        const d = parseInt(selectedDateStr.substring(6, 8), 10);
        const dayOfWeek = new Date(y, m, d).getDay();

        // 요일별 등록 단가 확인
        const dayPrices = scheduleData?.prices?.filter(p => p.dayOfWeek === dayOfWeek) || [];

        // 기본 시간대: 09:00 ~ 22:00 (단가 설정에서 시간대를 늘려놓으면 늘려놓은 기준 적용)
        let startHour = 9;
        let endHour = 22;

        if (dayPrices.length > 0) {
            const minPriceHour = Math.min(...dayPrices.map(p => parseInt(p.sttTime.substring(0, 2), 10)));
            const maxPriceHour = Math.max(...dayPrices.map(p => parseInt(p.endTime.substring(0, 2), 10)));
            startHour = Math.min(9, minPriceHour);
            endHour = Math.max(22, maxPriceHour);
        }

        // 해당 일자의 예약 목록
        const dayReservations = scheduleData?.reservations?.filter(r => r.useDate === selectedDateStr) || [];

        const defaultPrice = scheduleData?.hourBaseUprice || 18000;

        const now = new Date();
        const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const currentHour = now.getHours();
        const isToday = selectedDateStr === todayStr;

        const slots: {
            timeStr: string;     // "16:00"
            slotKey: string;     // "1600"
            nextSlotKey: string; // "1700"
            isBooked: boolean;
            isPast: boolean;
            price: number;
            isDiscounted: boolean;
        }[] = [];

        for (let h = startHour; h < endHour; h++) {
            const slotKey = String(h).padStart(2, '0') + '00';
            const nextSlotKey = String(h + 1).padStart(2, '0') + '00';
            const timeStr = `${String(h).padStart(2, '0')}:00`;

            const isBooked = dayReservations.some(r => {
                const rStt = parseInt(r.sttTime, 10);
                const rEnd = parseInt(r.endTime, 10);
                const sTime = parseInt(slotKey, 10);
                return sTime >= rStt && sTime < rEnd;
            });

            // 오늘이고 현재 시간보다 이전(또는 이미 시작된 시간)이면 과거 시간대로 처리
            const isPast = isToday && (h <= currentHour);

            // 해당 시간의 단가 계산
            let slotPrice = defaultPrice;
            const matchedPrice = dayPrices.find(p => {
                const pStt = parseInt(p.sttTime, 10);
                const pEnd = parseInt(p.endTime, 10);
                const sTime = parseInt(slotKey, 10);
                return sTime >= pStt && sTime < pEnd;
            });
            if (matchedPrice && matchedPrice.timeUprice) {
                slotPrice = matchedPrice.timeUprice;
            }

            const isDiscounted = slotPrice < defaultPrice;

            slots.push({
                timeStr,
                slotKey,
                nextSlotKey,
                isBooked,
                isPast,
                price: slotPrice,
                isDiscounted
            });
        }

        return slots;
    }, [selectedDateStr, scheduleData]);

    // 시간 슬롯 클릭 (토글 방식: 선택 / 취소)
    const handleSlotClick = (slotKey: string, isBooked: boolean, isPast: boolean) => {
        if (isBooked || isPast) return;

        setSelectedSlots(prev => {
            if (prev.includes(slotKey)) {
                // 이미 선택된 슬롯이면 제거 (취소)
                return prev.filter(k => k !== slotKey);
            } else {
                // 새로 선택 시 추가
                return [...prev, slotKey];
            }
        });
    };

    // 선택된 시간 범위 및 금액 계산
    const selectionSummary = useMemo(() => {
        if (selectedSlots.length === 0) return null;

        const sorted = [...selectedSlots].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        const totalHours = sorted.length;

        // 시간대 텍스트 생성 (연속 구간 묶기)
        const timeRanges: string[] = [];
        let rangeStart = sorted[0];
        let prevKey = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            const currentKey = sorted[i];
            const prevHour = parseInt(prevKey.substring(0, 2), 10);
            const currentHour = parseInt(currentKey.substring(0, 2), 10);

            if (currentHour === prevHour + 1) {
                prevKey = currentKey;
            } else {
                const sHour = `${rangeStart.substring(0, 2)}:00`;
                const eHour = `${String(parseInt(prevKey.substring(0, 2), 10) + 1).padStart(2, '0')}:00`;
                timeRanges.push(`${sHour}~${eHour}`);
                rangeStart = currentKey;
                prevKey = currentKey;
            }
        }
        const sHour = `${rangeStart.substring(0, 2)}:00`;
        const eHour = `${String(parseInt(prevKey.substring(0, 2), 10) + 1).padStart(2, '0')}:00`;
        timeRanges.push(`${sHour}~${eHour}`);

        const timeRangeFormatted = timeRanges.join(', ');

        const earliestStart = sorted[0];
        const latestEnd = String(parseInt(sorted[sorted.length - 1].substring(0, 2), 10) + 1).padStart(2, '0') + '00';

        // 총 금액 계산
        let totalAmount = 0;
        sorted.forEach(slotKey => {
            const slotObj = availableSlots.find(s => s.slotKey === slotKey);
            totalAmount += slotObj ? slotObj.price : (scheduleData?.hourBaseUprice || 18000);
        });

        return {
            sttTime: earliestStart,
            endTime: latestEnd,
            timeRangeFormatted,
            totalHours,
            totalAmount
        };
    }, [selectedSlots, availableSlots, scheduleData]);

    // 선택된 날짜 포맷 (예: "7월 20일(일)")
    const selectedDateDisplay = useMemo(() => {
        if (!selectedDateStr || selectedDateStr.length !== 8) return '';
        const m = parseInt(selectedDateStr.substring(4, 6), 10);
        const d = parseInt(selectedDateStr.substring(6, 8), 10);
        const y = parseInt(selectedDateStr.substring(0, 4), 10);
        const dayOfWeek = new Date(y, m - 1, d).getDay();
        return `${m}월 ${d}일(${WEEK_DAYS[dayOfWeek]})`;
    }, [selectedDateStr]);

    // 예약 확인 페이지로 이동
    const handleGoToConfirm = () => {
        if (!selectionSummary || !selectedDateStr || !roomNo) return;
        navigate(`/main/jam/reservation/studios/${studioNo}/rooms/${roomNo}/confirm`, {
            state: {
                useDate: selectedDateStr,
                dateDisplay: selectedDateDisplay,
                timeRangeFormatted: selectionSummary.timeRangeFormatted,
                sttTime: selectionSummary.sttTime,
                endTime: selectionSummary.endTime,
                totalHours: selectionSummary.totalHours,
                totalAmount: selectionSummary.totalAmount,
                studioNm: scheduleData?.studioNm || '',
                roomNm: scheduleData?.roomNm || '',
                capacityCnt: scheduleData?.capacityCnt || 4,
                bankNm: (scheduleData as any)?.bankNm || '',
                accountNo: (scheduleData as any)?.accountNo || '',
                accountHolderNm: (scheduleData as any)?.accountHolderNm || ''
            }
        });
    };

    // 선택 날짜의 전체 슬롯이 모두 동일한 할인 단가로 적용되었는지 확인 (하루 종일 할인)
    const allDayDiscountPrice = useMemo(() => {
        if (availableSlots.length === 0) return null;
        const defaultPrice = scheduleData?.hourBaseUprice || 0;
        const firstPrice = availableSlots[0].price;
        if (firstPrice < defaultPrice && availableSlots.every(s => s.price === firstPrice)) {
            return firstPrice;
        }
        return null;
    }, [availableSlots, scheduleData]);

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard'] overflow-hidden">
            {/* Header */}
            <div className="shrink-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-1 -ml-1 text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <FaChevronLeft size={18} />
                </button>
                <h1 className="text-[17px] font-bold text-[#052c42]">날짜와 시간</h1>
                <div className="w-6" /> {/* 우측 여백 균형 */}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Month Selector */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-extrabold text-[#052c42]">
                        {currentYear}년 {currentMonth}월
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevMonth}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <FaChevronLeft size={12} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <FaChevronRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Calendar Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    {/* Legend & Month Header */}
                    <div className="flex items-center justify-end gap-3 mb-2 px-1 text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00BDF8]"></span> 선택
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 예약마감
                        </span>
                    </div>

                    {/* Weekday Header */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                        {WEEK_DAYS.map((wd, i) => (
                            <div
                                key={wd}
                                className={`text-[13px] font-semibold ${
                                    i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                                }`}
                            >
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Date Grid */}
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
                        {calendarDays.map((day, idx) => {
                            if (!day) {
                                return <div key={`empty-${idx}`} className="h-12" />;
                            }

                            const isSelected = day.dateStr === selectedDateStr;
                            const isClosed = day.isFullyBooked && !day.isPast;

                            return (
                                <div key={day.dateStr} className="flex flex-col items-center justify-center h-12">
                                    <button
                                        disabled={day.isPast}
                                        onClick={() => handleDateSelect(day.dateStr)}
                                        className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center text-[13px] font-bold transition-all relative ${
                                            isSelected
                                                ? 'bg-[#00BDF8] text-white shadow-md shadow-[#00BDF8]/30 scale-105'
                                                : day.isPast
                                                ? 'text-gray-300 cursor-not-allowed bg-gray-50/50'
                                                : isClosed
                                                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                                : day.dayOfWeek === 0
                                                ? 'text-rose-500 hover:bg-gray-100'
                                                : day.dayOfWeek === 6
                                                ? 'text-blue-500 hover:bg-gray-100'
                                                : 'text-gray-800 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="leading-none">{day.dateNumber}</span>
                                        {isClosed && (
                                            <span className={`text-[8px] font-extrabold mt-0.5 leading-none ${
                                                isSelected ? 'text-white/90' : 'text-rose-500'
                                            }`}>
                                                마감
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date & Room Label */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-1">
                    <h3 className="text-[16px] font-bold text-[#052c42]">
                        {selectedDateDisplay} · {scheduleData?.roomNm || '룸'}
                    </h3>
                    {scheduleData?.hourBaseUprice && (
                        allDayDiscountPrice ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] text-gray-400 line-through">
                                    {scheduleData.hourBaseUprice.toLocaleString()}원
                                </span>
                                <span className="text-[13px] font-bold text-[#00BDF8] bg-[#00BDF8]/10 px-2.5 py-0.5 rounded-full">
                                    {allDayDiscountPrice.toLocaleString()}원 / 시간
                                </span>
                            </div>
                        ) : (
                            <span className="text-[13px] font-bold text-[#00BDF8] bg-[#00BDF8]/10 px-2.5 py-0.5 rounded-full">
                                {scheduleData.hourBaseUprice.toLocaleString()}원 / 시간
                            </span>
                        )
                    )}
                </div>

                {/* Horizontal Time Slots Scroll */}
                <div className="space-y-2">
                    <div
                        ref={timeScrollRef}
                        className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth -mx-4 px-4"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {isLoading ? (
                            <div className="py-4 text-gray-400 text-[13px]">시간 정보를 불러오는 중...</div>
                        ) : availableSlots.length === 0 ? (
                            <div className="py-4 text-gray-400 text-[13px]">예약 가능한 시간대가 없습니다.</div>
                        ) : (
                            availableSlots.map(slot => {
                                const isSelected = selectedSlots.includes(slot.slotKey);
                                return (
                                    <button
                                        key={slot.slotKey}
                                        disabled={slot.isBooked || slot.isPast}
                                        onClick={() => handleSlotClick(slot.slotKey, slot.isBooked, slot.isPast)}
                                        className={`shrink-0 px-3.5 py-2 rounded-2xl flex flex-col items-center justify-center text-[13px] font-bold border transition-all duration-200 min-w-[72px] ${
                                            slot.isBooked
                                                ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                                                : slot.isPast
                                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                : isSelected
                                                ? 'bg-[#00BDF8] text-white border-[#00BDF8] shadow-md shadow-[#00BDF8]/30 scale-105'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#00BDF8] hover:text-[#00BDF8]'
                                        }`}
                                    >
                                        <span className="leading-tight">{slot.timeStr}</span>
                                        {slot.isDiscounted && !slot.isBooked && !slot.isPast && (
                                            <span className={`text-[10px] font-extrabold mt-0.5 leading-none ${
                                                isSelected ? 'text-white' : 'text-[#FF4B4B]'
                                            }`}>
                                                할인중
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Selected Info Summary & Price */}
                {selectionSummary && (
                    <div className="bg-[#f0faff] border border-[#00BDF8]/20 rounded-2xl p-4 space-y-2">
                        <div className="text-[13px] font-semibold text-gray-600">
                            {selectionSummary.timeRangeFormatted} · {selectionSummary.totalHours}시간 · {scheduleData?.capacityCnt || 4}명
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#00BDF8]/10">
                            <span className="text-[13px] font-bold text-gray-500">예상 결제 금액</span>
                            <span className="text-[18px] font-extrabold text-[#00BDF8]">
                                {selectionSummary.totalAmount.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom CTA Button */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <button
                    disabled={!selectionSummary}
                    onClick={handleGoToConfirm}
                    className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all ${
                        selectionSummary
                            ? 'bg-[#00BDF8] text-white hover:bg-[#009fd4] active:scale-[0.98] shadow-lg shadow-[#00BDF8]/30'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    예약 정보 확인
                </button>
            </div>
        </div>
    );
};

export default JamRoomBook;
