import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaChevronDown,
    FaChevronUp,
    FaDoorOpen,
    FaCalendarAlt,
    FaRegClock,
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';
import ClanJamSelectModal, { type EligibleJam } from '../components/clan/ClanJamSelectModal';

interface RoomScheduleDto {
    cnSchNo: number;
    cnNo: number;
    bnNo: number;
    bnNm: string;
    bnSongNm?: string;
    bnSingerNm?: string;
    bnImg?: string;
    schSttDate: string; // YYYYMMDD
    schSttTime: string; // HHMMSS or HHMM
    schEndDate: string; // YYYYMMDD
    schEndTime: string; // HHMMSS or HHMM
    schStatCd: string;
    insDtime: string;
    insId: string;
    userNickNm?: string;
    profileImageUrl?: string;
    canDelete?: boolean;
}

const defaultTimeHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const ClanRoomSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const userId = localStorage.getItem('userId') || '';

    const [clanInfo, setClanInfo] = useState<{ id: number; name: string; roomSttTime?: string; roomEndTime?: string } | null>(null);
    const [eligibleJams, setEligibleJams] = useState<EligibleJam[]>([]);
    const [isJamSelectModalOpen, setIsJamSelectModalOpen] = useState(false);
    const [schedules, setSchedules] = useState<RoomScheduleDto[]>([]);

    // 주간 예약 목록 펼치기 / 닫기 상태
    const [isWeekListOpen, setIsWeekListOpen] = useState(true);

    // 캘린더 주차 기준일자 (일요일 기준)
    const [currentBaseDate, setCurrentBaseDate] = useState<Date>(() => {
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - today.getDay());
        sunday.setHours(0, 0, 0, 0);
        return sunday;
    });

    // 동방 설정 시간대 (시작 ~ 종료) 동적 계산
    const timeHours = useMemo(() => {
        if (!clanInfo || !clanInfo.roomSttTime || !clanInfo.roomEndTime) {
            return defaultTimeHours;
        }
        const stt = parseInt(clanInfo.roomSttTime, 10);
        const end = parseInt(clanInfo.roomEndTime, 10);
        if (isNaN(stt) || isNaN(end) || stt >= end) {
            return defaultTimeHours;
        }
        const hours: number[] = [];
        for (let h = stt; h < end; h++) {
            hours.push(h);
        }
        return hours.length > 0 ? hours : defaultTimeHours;
    }, [clanInfo]);

    // 멀티 선택된 슬롯들: Set of "YYYYMMDD_HH00"
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const selectedSlotsRef = useRef<Set<string>>(new Set());

    // selectedSlots 상태와 Ref 동기화
    useEffect(() => {
        selectedSlotsRef.current = selectedSlots;
    }, [selectedSlots]);

    // 모달 상태
    const [modalInfo, setModalInfo] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 드래그 제어 변수
    const isDragging = useRef(false);
    const initialAction = useRef<'select' | 'deselect'>('select');
    const justTouched = useRef(false);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // 날짜 포맷 헬퍼 (YYYYMMDD)
    const formatDateToYMD = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // 주간 7일 날짜 목록 계산
    const getWeekDays = (base: Date) => {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentBaseDate);

    // 주간 이동 핸들러
    const handlePrevWeek = () => {
        const next = new Date(currentBaseDate);
        next.setDate(next.getDate() - 7);
        setCurrentBaseDate(next);
    };

    const handleNextWeek = () => {
        const next = new Date(currentBaseDate);
        next.setDate(next.getDate() + 7);
        setCurrentBaseDate(next);
    };

    // 스케쥴 조회
    const fetchSchedules = useCallback(async () => {
        if (!clanId) return;
        try {
            const rangeStart = new Date(currentBaseDate);
            rangeStart.setDate(rangeStart.getDate() - 7);
            const rangeEnd = new Date(currentBaseDate);
            rangeEnd.setDate(rangeEnd.getDate() + 14);

            const startStr = formatDateToYMD(rangeStart);
            const endStr = formatDateToYMD(rangeEnd);

            const res = await fetch(
                `/api/clan/${clanId}/room-schedules?startDate=${startStr}&endDate=${endStr}&userId=${userId}`
            );
            if (res.ok) {
                const data = await res.json();
                setSchedules(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch room schedules', err);
        }
    }, [clanId, currentBaseDate, userId]);

    // 초기 데이터 로드
    useEffect(() => {
        if (!clanId) return;

        const loadInitData = async () => {
            try {
                const clanRes = await fetch(`/api/clans/${clanId}`);
                if (clanRes.ok) {
                    const clanData = await clanRes.json();
                    setClanInfo({
                        id: clanData.cnNo,
                        name: clanData.cnNm,
                        roomSttTime: clanData.roomSttTime,
                        roomEndTime: clanData.roomEndTime
                    });
                }
                await fetchSchedules();
            } catch (err) {
                console.error('Failed to load init data', err);
            }
        };

        loadInitData();
    }, [clanId, fetchSchedules]);

    // 전역 마우스업 / 터치종료 리스너
    useEffect(() => {
        const handleGlobalEnd = () => {
            isDragging.current = false;
        };
        window.addEventListener('mouseup', handleGlobalEnd);
        window.addEventListener('touchend', handleGlobalEnd);
        return () => {
            window.removeEventListener('mouseup', handleGlobalEnd);
            window.removeEventListener('touchend', handleGlobalEnd);
        };
    }, []);

    // 특정 슬롯이 이미 예약되어 있는지 확인
    const getSlotReservation = (dateStr: string, hour: number) => {
        const slotStart = `${String(hour).padStart(2, '0')}0000`;
        const slotEnd = `${String(hour + 1).padStart(2, '0')}0000`;

        return schedules.find((sch) => {
            if (sch.schSttDate !== dateStr) return false;
            const schStart = sch.schSttTime.padEnd(6, '0');
            const schEnd = sch.schEndTime.padEnd(6, '0');
            return schStart < slotEnd && schEnd > slotStart;
        });
    };

    // 일자 또는 시간대가 지난 일정인지 확인 (과거 시간 판별)
    const isSlotPast = (dateStr: string, hour: number) => {
        const now = new Date();
        const currentYYYYMMDD = formatDateToYMD(now);
        const currentHour = now.getHours();

        if (dateStr < currentYYYYMMDD) return true;
        if (dateStr === currentYYYYMMDD && hour <= currentHour) return true;
        return false;
    };

    // 슬롯 멀티 토글 (드래그 및 클릭)
    const toggleSlot = (
        dateStr: string,
        hour: number,
        forceAction?: 'select' | 'deselect'
    ) => {
        const reservation = getSlotReservation(dateStr, hour);
        const past = isSlotPast(dateStr, hour);

        if (reservation || past) {
            return;
        }

        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        setSelectedSlots((prev) => {
            const next = new Set(prev);
            const exists = next.has(key);
            const action = forceAction || (exists ? 'deselect' : 'select');

            if (action === 'select') {
                next.add(key);
            } else {
                next.delete(key);
            }
            return next;
        });
    };

    // 모바일 터치 드래그 리스너 (슬롯 셀 위에서 드래그할 때만 preventDefault 적용하여 스크롤 간섭 방지)
    useEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;

        const onTouchMoveNative = (e: TouchEvent) => {
            if (isDragging.current && e.touches.length > 0) {
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target) {
                    const cell = target.closest('[data-slot-key]');
                    if (cell) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        const date = cell.getAttribute('data-date');
                        const hour = cell.getAttribute('data-hour');
                        if (date && hour) {
                            toggleSlot(date, parseInt(hour, 10), initialAction.current);
                        }
                    }
                }
            }
        };

        el.addEventListener('touchmove', onTouchMoveNative, { passive: false });
        return () => {
            el.removeEventListener('touchmove', onTouchMoveNative);
        };
    }, [weekDays, schedules]);

    const handleCellMouseDown = (dateStr: string, hour: number, e: React.MouseEvent) => {
        if (justTouched.current) return;
        e.preventDefault();

        const reservation = getSlotReservation(dateStr, hour);
        const past = isSlotPast(dateStr, hour);
        if (reservation || past) {
            return;
        }

        isDragging.current = true;
        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        const isSelected = selectedSlotsRef.current.has(key);
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellMouseEnter = (dateStr: string, hour: number) => {
        if (!isDragging.current) return;
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellTouchStart = (dateStr: string, hour: number) => {
        justTouched.current = true;
        setTimeout(() => {
            justTouched.current = false;
        }, 400);

        const reservation = getSlotReservation(dateStr, hour);
        const past = isSlotPast(dateStr, hour);
        if (reservation || past) {
            return;
        }

        isDragging.current = true;
        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        const isSelected = selectedSlotsRef.current.has(key);
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    // 선택 요약 텍스트
    const getSelectionSummary = () => {
        const dates = new Set<string>();
        selectedSlots.forEach((k) => {
            const [d] = k.split('_');
            dates.add(d);
        });
        const totalHours = selectedSlots.size;
        if (totalHours === 0) return '선택된 시간 없음';
        return `${dates.size}개 날짜 · 총 ${totalHours}시간 선택`;
    };

    // 날짜 컬럼 헤더 포맷
    const formatShortDate = (d: Date) => {
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[d.getDay()];
        return {
            dateStr: `${month}/${day}`,
            dayName,
        };
    };

    // 이번 주 예약 목록 필터링
    const currentWeekDateStrs = weekDays.map((d) => formatDateToYMD(d));
    const weekSchedules = schedules
        .filter((s) => currentWeekDateStrs.includes(s.schSttDate))
        .sort((a, b) => {
            if (a.schSttDate !== b.schSttDate) return a.schSttDate.localeCompare(b.schSttDate);
            return a.schSttTime.localeCompare(b.schSttTime);
        });

    // 실제 서버에 예약 요청 실행 함수 (선택된 합주방으로 연속 블록 순차 전송)
    const executeReservation = async (jam: EligibleJam) => {
        // 선택 슬롯들을 날짜별로 그룹화 및 연속 블록 분할
        const slotsByDate: { [date: string]: number[] } = {};
        selectedSlots.forEach((k) => {
            const [d, t] = k.split('_');
            const h = parseInt(t.substring(0, 2), 10);
            if (!slotsByDate[d]) slotsByDate[d] = [];
            slotsByDate[d].push(h);
        });

        const reservationBlocks: {
            date: string;
            sttHour: number;
            endHour: number;
        }[] = [];

        Object.keys(slotsByDate).forEach((date) => {
            const hours = slotsByDate[date].sort((a, b) => a - b);
            if (hours.length === 0) return;

            let blockStart = hours[0];
            let prevHour = hours[0];

            for (let i = 1; i < hours.length; i++) {
                if (hours[i] === prevHour + 1) {
                    prevHour = hours[i];
                } else {
                    reservationBlocks.push({
                        date,
                        sttHour: blockStart,
                        endHour: prevHour + 1,
                    });
                    blockStart = hours[i];
                    prevHour = hours[i];
                }
            }
            reservationBlocks.push({
                date,
                sttHour: blockStart,
                endHour: prevHour + 1,
            });
        });

        setIsSubmitting(true);
        try {
            for (const block of reservationBlocks) {
                const sttTime = `${String(block.sttHour).padStart(2, '0')}0000`;
                const endTime = `${String(block.endHour).padStart(2, '0')}0000`;

                const payload = {
                    cnNo: Number(clanId),
                    bnNo: jam.bnNo,
                    schSttDate: block.date,
                    schSttTime: sttTime,
                    schEndDate: block.date,
                    schEndTime: endTime,
                    insId: userId,
                };

                const res = await fetch(
                    `/api/clan/${clanId}/room-schedules?userId=${userId}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    }
                );

                if (res.status === 409) {
                    const errorData = await res.json().catch(() => ({}));
                    setModalInfo({
                        isOpen: true,
                        title: '예약 중복 충돌',
                        message:
                            errorData.message ||
                            '선택하신 시간대에 이미 다른 합주방의 예약이 완료되었습니다. 최신 현황으로 갱신합니다.',
                        type: 'alert',
                        onConfirm: () => {
                            setSelectedSlots(new Set());
                            fetchSchedules();
                        },
                    });
                    return;
                }

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    setModalInfo({
                        isOpen: true,
                        title: '예약 실패',
                        message: errorData.message || '예약 처리 중 오류가 발생했습니다.',
                        type: 'alert',
                    });
                    return;
                }
            }

            // 예약 완료
            setModalInfo({
                isOpen: true,
                title: '동방 예약 완료',
                message: `[${jam.bnNm}]의 동방 일정이 성공적으로 예약되었습니다! 🎉`,
                type: 'alert',
                onConfirm: () => {
                    setSelectedSlots(new Set());
                    fetchSchedules();
                },
            });
        } catch (err) {
            console.error('Reservation error', err);
            setModalInfo({
                isOpen: true,
                title: '오류 발생',
                message: '네트워크 통신 중 오류가 발생했습니다.',
                type: 'alert',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // [동방 일정 예약 저장] 버튼 클릭 핸들러 (저장 시점에 소속 합주방 실시간 조회 및 분기)
    const handleSubmitReservation = async () => {
        if (!userId) {
            setModalInfo({
                isOpen: true,
                title: '로그인 필요',
                message: '로그인이 필요한 서비스입니다.',
                type: 'alert',
            });
            return;
        }

        if (selectedSlots.size === 0) {
            setModalInfo({
                isOpen: true,
                title: '시간 선택 필요',
                message: '시간표에서 예약할 시간 슬롯을 터치하여 선택해 주세요.',
                type: 'alert',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `/api/clan/${clanId}/room-schedules/eligible-jams?userId=${userId}`
            );
            if (!res.ok) {
                setModalInfo({
                    isOpen: true,
                    title: '조회 실패',
                    message: '합주방 소속 정보를 조회하는 중 오류가 발생했습니다.',
                    type: 'alert',
                });
                return;
            }

            const jams: EligibleJam[] = await res.json();

            if (!jams || jams.length === 0) {
                setModalInfo({
                    isOpen: true,
                    title: '동방 예약 불가',
                    message: '합주방에 소속되어 있어야 동방 예약이 가능합니다.',
                    type: 'alert',
                });
                return;
            }

            if (jams.length === 1) {
                // 단일 합주방 -> 즉시 해당 합주방으로 예약 실행
                await executeReservation(jams[0]);
            } else {
                // 멀티 합주방 -> 선택 팝업 모달 표시
                setEligibleJams(jams);
                setIsJamSelectModalOpen(true);
            }
        } catch (err) {
            console.error('Eligible jams error', err);
            setModalInfo({
                isOpen: true,
                title: '오류 발생',
                message: '합주방 소속 정보를 조회하는 중 오류가 발생했습니다.',
                type: 'alert',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 예약 취소
    const handleDeleteReservation = (sch: RoomScheduleDto) => {
        setModalInfo({
            isOpen: true,
            title: '예약 취소 확인',
            message: `[${sch.bnNm}]의 ${sch.schSttTime.slice(0, 2)}:00 ~ ${sch.schEndTime.slice(0, 2)}:00 동방 예약을 취소하시겠습니까?`,
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const res = await fetch(
                        `/api/clan/${clanId}/room-schedules/${sch.cnSchNo}?userId=${userId}`,
                        { method: 'DELETE' }
                    );

                    if (res.ok) {
                        setModalInfo({
                            isOpen: true,
                            title: '예약 취소 완료',
                            message: '동방 예약이 취소되었습니다.',
                            type: 'alert',
                            onConfirm: () => fetchSchedules(),
                        });
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        setModalInfo({
                            isOpen: true,
                            title: '취소 실패',
                            message: errorData.message || '예약 취소 중 오류가 발생했습니다.',
                            type: 'alert',
                        });
                    }
                } catch (err) {
                    console.error('Failed to delete schedule', err);
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#FAFBFD] font-['Inter','Pretendard',sans-serif] text-[#0B1114] pb-24 selection:bg-[#00BDF8] selection:text-white">
            {/* 상단 네비게이션 헤더 */}
            <div className="sticky top-[calc(var(--header-height)+var(--safe-top))] z-40 bg-[#FAFBFD]/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
                <div className="max-w-[440px] mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/main/clan/detail/${clanId}`)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200/60 active:scale-90 transition-all cursor-pointer"
                        aria-label="뒤로가기"
                    >
                        <FaChevronLeft size={18} />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-[16px] font-bold text-[#0B1114] flex items-center gap-1.5 truncate max-w-[240px]">
                            <FaDoorOpen className="text-[#00BDF8]" size={16} />
                            동방 예약
                        </h1>
                        <span className="text-[12px] text-gray-500 font-medium truncate max-w-[200px]">
                            {clanInfo ? clanInfo.name : '클랜 동방'}
                        </span>
                    </div>
                    <div className="w-9" />
                </div>
            </div>

            <div className="max-w-[440px] mx-auto px-3 sm:px-4 pt-3 sm:pt-4 flex flex-col gap-3.5 sm:gap-4">
                {/* 1. 일정 시간표 헤더 및 시간표 요약 */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-row justify-between items-center px-1">
                        <h3 className="text-[17px] sm:text-[18px] font-bold leading-[26px] text-[#0B1114]">
                            일정 시간표
                        </h3>
                        <span className="text-[12px] font-semibold text-[#00BDF8]">
                            {getSelectionSummary()}
                        </span>
                    </div>

                    {/* 주차 이동 바 */}
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E5E5E5] text-[13px] text-gray-700 font-medium shadow-2xs">
                        <button
                            onClick={handlePrevWeek}
                            className="p-1 hover:text-[#00BDF8] active:scale-90 transition-all cursor-pointer flex items-center gap-1 font-bold text-gray-700"
                        >
                            <FaChevronLeft size={11} />
                            <span>이전 주</span>
                        </button>
                        <span className="font-bold text-[#0B1114]">
                            {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} ~{' '}
                            {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
                        </span>
                        <button
                            onClick={handleNextWeek}
                            className="p-1 hover:text-[#00BDF8] active:scale-90 transition-all cursor-pointer flex items-center gap-1 font-bold text-gray-700"
                        >
                            <span>다음 주</span>
                            <FaChevronRight size={11} />
                        </button>
                    </div>

                    {/* 상태 구분 범례 바 */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#525252] bg-[#F8FAFC] px-3 py-2 rounded-[10px] border border-[#EBECEF]">
                        <div className="flex items-center gap-1 font-medium">
                            <span className="text-gray-500">동방:</span>
                            <span className="font-bold text-[#0B1114]">1실</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-[3px] bg-white border border-gray-300 inline-block shadow-2xs" />
                                <span className="text-[11px] text-gray-700">예약 가능</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-[3px] bg-[#00BDF8] inline-block shadow-2xs" />
                                <span className="text-[11px] font-bold text-[#0098CC]">선택 중</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-[3px] bg-[#2EE59D] inline-block shadow-2xs" />
                                <span className="text-[11px] font-bold text-[#1eb375]">예약 완료</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-[3px] bg-[#E2E8F0] inline-block shadow-2xs" />
                                <span className="text-[11px] font-medium text-gray-400">지난 일정</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. 일정 시간표 그리드 테이블 (100% 반응형 table-fixed, 토요일 짤림 방지, KST 스크롤 지원) */}
                    <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-2 sm:p-3 shadow-xs select-none">
                        <div
                            ref={gridContainerRef}
                            className="w-full select-none"
                            style={{ userSelect: 'none' }}
                        >
                            <table className="w-full table-fixed border-collapse text-center select-none">
                                {/* Date Columns Header */}
                                <thead style={{ touchAction: 'pan-y' }}>
                                    <tr className="border-b border-[#E5E5E5]">
                                        <th
                                            className="w-[36px] sm:w-[42px] py-1.5 text-[11px] sm:text-[12px] font-semibold text-[#525252] bg-white"
                                            style={{ touchAction: 'pan-y' }}
                                        >
                                            KST
                                        </th>
                                        {weekDays.map((d, idx) => {
                                            const { dateStr, dayName } = formatShortDate(d);
                                            const isSunday = d.getDay() === 0;
                                            const isSaturday = d.getDay() === 6;
                                            return (
                                                <th
                                                    key={idx}
                                                    className="py-1 px-0 text-center font-medium bg-white"
                                                    style={{ touchAction: 'pan-y' }}
                                                >
                                                    <div className="text-[11px] sm:text-[12px] text-[#0B1114] leading-tight font-semibold">
                                                        {dateStr}
                                                    </div>
                                                    <div
                                                        className={`text-[10px] sm:text-[11px] leading-tight font-medium ${
                                                            isSunday
                                                                ? 'text-red-500'
                                                                : isSaturday
                                                                ? 'text-blue-500'
                                                                : 'text-[#737373]'
                                                        }`}
                                                    >
                                                        {dayName}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                {/* Time Rows */}
                                <tbody>
                                    {timeHours.map((hour: number) => {
                                        const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                                        return (
                                            <tr key={hour} className="h-[38px] sm:h-[42px]">
                                                {/* 세로 시간 라벨 (KST 열: touchAction pan-y로 위아래 스크롤 완벽 지원) */}
                                                <td
                                                    data-kst="true"
                                                    className="w-[36px] sm:w-[42px] text-[11px] sm:text-[12px] font-semibold text-[#626A72] bg-white select-none cursor-default leading-none"
                                                    style={{ touchAction: 'pan-y' }}
                                                >
                                                    {hourLabel}
                                                </td>

                                                {/* 각 일자별 셀 (7개 요일 균등 분할) */}
                                                {weekDays.map((d, colIdx) => {
                                                    const dateStr = formatDateToYMD(d);
                                                    const slotKey = `${dateStr}_${String(hour).padStart(2, '0')}00`;
                                                    const isSelected = selectedSlots.has(slotKey);
                                                    const reservation = getSlotReservation(dateStr, hour);
                                                    const past = isSlotPast(dateStr, hour);

                                                    let cellBg = '#FFFFFF';
                                                    let cursorStyle = 'cursor-pointer';

                                                    if (isSelected) {
                                                        cellBg = '#00BDF8';
                                                    } else if (reservation) {
                                                        cellBg = '#2EE59D';
                                                    } else if (past) {
                                                        cellBg = '#E2E8F0';
                                                        cursorStyle = 'cursor-not-allowed';
                                                    }

                                                    return (
                                                        <td
                                                            key={colIdx}
                                                            data-slot-key={slotKey}
                                                            data-date={dateStr}
                                                            data-hour={hour}
                                                            onMouseDown={(e) =>
                                                                handleCellMouseDown(dateStr, hour, e)
                                                            }
                                                            onMouseEnter={() =>
                                                                handleCellMouseEnter(dateStr, hour)
                                                            }
                                                            onTouchStart={() =>
                                                                handleCellTouchStart(dateStr, hour)
                                                            }
                                                            className={`p-0 h-[38px] sm:h-[42px] transition-colors relative select-none ${cursorStyle}`}
                                                            style={{
                                                                backgroundColor: cellBg,
                                                                touchAction: 'pan-y',
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <p className="text-[11px] text-[#525252] px-1">
                        원하는 시간을 터치 또는 드래그하여 선택하거나 취소할 수 있습니다.
                    </p>
                </div>

                {/* 3. 이번 주 예약 현황 목록 (3단 반응형 레이아웃) */}
                <div className="bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden shadow-xs">
                    {/* Toolbar Header */}
                    <button
                        type="button"
                        onClick={() => setIsWeekListOpen((prev) => !prev)}
                        className="w-full px-3.5 py-3 bg-[#F8FAFC] hover:bg-gray-100/80 flex items-center justify-between transition-colors cursor-pointer select-none text-left"
                    >
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-[#00BDF8]" size={13} />
                            <span className="text-[13px] sm:text-[14px] font-bold text-gray-900">
                                이번 주 예약 현황
                            </span>
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-[#00BDF8] border border-cyan-200">
                                {weekSchedules.length}건
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-500">
                            <span>{isWeekListOpen ? '닫기' : '펼치기'}</span>
                            {isWeekListOpen ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                        </div>
                    </button>

                    {/* Collapsible Content */}
                    {isWeekListOpen && (
                        <div className="p-2.5 sm:p-3 border-t border-gray-100">
                            {weekSchedules.length > 0 ? (
                                <div className="divide-y divide-gray-100 space-y-1">
                                    {weekSchedules.map((sch) => {
                                        const m = parseInt(sch.schSttDate.substring(4, 6), 10);
                                        const d = parseInt(sch.schSttDate.substring(6, 8), 10);
                                        const dateObj = new Date(
                                            parseInt(sch.schSttDate.substring(0, 4), 10),
                                            m - 1,
                                            d
                                        );
                                        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                                        const dayName = dayNames[dateObj.getDay()];

                                        return (
                                            <div
                                                key={sch.cnSchNo}
                                                className="py-2 px-2 flex items-center justify-between gap-2 hover:bg-gray-50/70 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div className="w-1 self-stretch bg-[#00BDF8] rounded-full min-h-[44px] shrink-0" />
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        {/* 1라인: 합주방명 */}
                                                        <h4 className="text-[13px] sm:text-[14px] font-bold text-gray-900 truncate leading-tight">
                                                            {sch.bnNm}
                                                        </h4>
                                                        {/* 2라인: 제목 (곡명) */}
                                                        {sch.bnSongNm && (
                                                            <p className="text-[11px] text-[#626A72] font-medium truncate leading-tight">
                                                                {sch.bnSongNm}
                                                            </p>
                                                        )}
                                                        {/* 3라인: 일시 및 예약자 */}
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
                                                            <div className="bg-[#F2F5F7] rounded-[6px] px-1.5 py-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#525252] font-semibold shrink-0">
                                                                <FaRegClock size={9} className="text-[#00BDF8]" />
                                                                <span>
                                                                    {m}/{d}({dayName}) {sch.schSttTime.slice(0, 2)}:00 ~{' '}
                                                                    {sch.schEndTime.slice(0, 2)}:00
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                                                                예약자: {sch.userNickNm || sch.insId}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {sch.canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteReservation(sch)}
                                                        className="px-2.5 py-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
                                                    >
                                                        취소
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-[12px] text-gray-400 py-3">
                                    이번 주에 등록된 동방 예약이 없습니다.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 4. 예약 완료 및 초기화 버튼 */}
                <div className="flex flex-col gap-2 pt-1">
                    <button
                        onClick={handleSubmitReservation}
                        disabled={selectedSlots.size === 0 || isSubmitting}
                        className="w-full h-[50px] sm:h-[52px] bg-[#00BDF8] hover:bg-[#00a8dc] active:scale-[0.99] text-white text-[15px] font-bold rounded-[12px] flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(0,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? '예약 처리 중...' : '동방 일정 예약 저장'}
                    </button>
                    {selectedSlots.size > 0 && (
                        <button
                            onClick={() => setSelectedSlots(new Set())}
                            className="w-full py-1 text-center text-[12px] text-gray-500 hover:text-gray-700 underline cursor-pointer"
                        >
                            선택 슬롯 전체 초기화
                        </button>
                    )}
                </div>
            </div>

            {/* 멀티 합주방 소속 시 선택 모달 */}
            <ClanJamSelectModal
                isOpen={isJamSelectModalOpen}
                onClose={() => setIsJamSelectModalOpen(false)}
                jams={eligibleJams}
                onSelectJam={(jam) => {
                    setIsJamSelectModalOpen(false);
                    executeReservation(jam);
                }}
            />

            {/* Common Alert / Confirm Modal */}
            <CommonModal
                isOpen={modalInfo.isOpen}
                onConfirm={() => {
                    setModalInfo((prev) => ({ ...prev, isOpen: false }));
                    if (modalInfo.onConfirm) {
                        modalInfo.onConfirm();
                    }
                }}
                onCancel={() => {
                    setModalInfo((prev) => ({ ...prev, isOpen: false }));
                }}
                title={modalInfo.title}
                message={modalInfo.message}
                type={modalInfo.type}
            />
        </div>
    );
};

export default ClanRoomSchedule;
