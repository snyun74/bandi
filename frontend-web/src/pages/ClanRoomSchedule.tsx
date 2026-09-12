import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    FaChevronLeft,
    FaChevronRight,
    FaChevronDown,
    FaChevronUp,
    FaMusic,
    FaDoorOpen,
    FaCalendarAlt,
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

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

interface ClanJamDetail {
    bnNo: number;
    bnNm: string;
    bnSongNm?: string;
    bnSingerNm?: string;
    bnConfFg: string;
    bnImg?: string;
}

const timeHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const ClanRoomSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [searchParams] = useSearchParams();
    const bnNoParam = searchParams.get('bnNo');
    const userId = localStorage.getItem('userId') || '';

    const [clanInfo, setClanInfo] = useState<{ id: number; name: string } | null>(null);
    const [selectedJam, setSelectedJam] = useState<ClanJamDetail | null>(null);
    const [eligibleJams, setEligibleJams] = useState<ClanJamDetail[]>([]);
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

    // 멀티 선택된 슬롯들: Set of "YYYYMMDD_HH00"
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const selectedSlotsRef = useRef<Set<string>>(new Set());

    // selectedSlots 상태와 Ref 항상 동기화 (최신 클로저 유지)
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

    // 부드러운 드래그 / 터치 다중 선택 제어
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
                // 클랜 정보
                const clanRes = await fetch(`/api/clans/${clanId}`);
                if (clanRes.ok) {
                    const clanData = await clanRes.json();
                    setClanInfo({ id: clanData.cnNo, name: clanData.cnNm });
                }

                // 예약 가능 합주방 목록
                if (userId) {
                    const jamsRes = await fetch(
                        `/api/clan/${clanId}/room-schedules/eligible-jams?userId=${userId}`
                    );
                    if (jamsRes.ok) {
                        const jamsData: ClanJamDetail[] = await jamsRes.json();
                        setEligibleJams(jamsData);

                        if (bnNoParam) {
                            const found = jamsData.find((j) => String(j.bnNo) === bnNoParam);
                            if (found) {
                                setSelectedJam(found);
                            } else if (jamsData.length > 0) {
                                setSelectedJam(jamsData[0]);
                            }
                        } else if (jamsData.length > 0) {
                            setSelectedJam(jamsData[0]);
                        }
                    }
                }

                // 스케쥴 조회
                await fetchSchedules();
            } catch (err) {
                console.error('Failed to load init data', err);
            }
        };

        loadInitData();
    }, [clanId, bnNoParam, userId, fetchSchedules]);

    // 전역 마우스업 / 터치종료 리스너
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            isDragging.current = false;
        };
        const handleGlobalTouchEnd = () => {
            isDragging.current = false;
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalTouchEnd);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
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

        // 이미 예약되었거나 지난 시간은 신규 선택/해제 불가
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

    // 모바일 터치 드래그 리스너
    useEffect(() => {
        const el = gridContainerRef.current;
        if (!el) return;

        const onTouchMoveNative = (e: TouchEvent) => {
            if (isDragging.current) {
                if (e.cancelable) {
                    e.preventDefault();
                }
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target) {
                    const cell = target.closest('[data-slot-key]');
                    if (cell) {
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
        // 이미 선택된 셀에서 드래그 시작 시 -> deselect (취소) 모드, 미선택 셀 시작 시 -> select 모드
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellMouseEnter = (dateStr: string, hour: number) => {
        if (!isDragging.current) return;
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellTouchStart = (dateStr: string, hour: number, e: React.TouchEvent) => {
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
        // 이미 선택된 셀에서 터치 시작 시 -> deselect (취소) 모드, 미선택 셀 시작 시 -> select 모드
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    // 선택 요약 텍스트 (4개 날짜 · 총 12시간 선택)
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

    // 예약 저장 핸들러 (연속된 시간대 블록별로 분할하여 전송)
    const handleSubmitReservation = async () => {
        if (!selectedJam) {
            setModalInfo({
                isOpen: true,
                title: '합주방 선택 필요',
                message: '동방 예약을 진행할 합주방을 선택해 주세요.',
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
            // 모든 블록 순차 예약 요청 (저장 시점 실시간 중복 체크)
            for (const block of reservationBlocks) {
                const sttTime = `${String(block.sttHour).padStart(2, '0')}0000`;
                const endTime = `${String(block.endHour).padStart(2, '0')}0000`;

                const payload = {
                    cnNo: Number(clanId),
                    bnNo: selectedJam.bnNo,
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
                    const errorData = await res.json();
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

            // 성공
            setModalInfo({
                isOpen: true,
                title: '동방 예약 완료',
                message: `${selectedJam.bnNm}의 동방 일정이 성공적으로 예약되었습니다! 🎉`,
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
                        <span className="text-[12px] text-gray-500 font-medium">
                            {clanInfo ? clanInfo.name : '클랜 동방'}
                        </span>
                    </div>
                    <div className="w-9" />
                </div>
            </div>

            <div className="max-w-[440px] mx-auto px-4 pt-4 flex flex-col gap-4">
                {/* 1. 신청 합주방 선택 카드 */}
                <div className="bg-white rounded-[14px] border border-[#E5E5E5] p-3.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00BDF8] to-sky-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                                <FaMusic size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-sky-50 text-[#00BDF8] border border-sky-200 inline-block">
                                    예약 신청 합주방
                                </span>
                                <h2 className="text-[14px] font-bold text-gray-900 truncate mt-0.5" title={selectedJam?.bnNm}>
                                    {selectedJam ? selectedJam.bnNm : '선택된 합주방 없음'}
                                </h2>
                                <p className="text-[11px] text-gray-500 truncate">
                                    {selectedJam?.bnSongNm
                                        ? `${selectedJam.bnSongNm} - ${selectedJam.bnSingerNm || ''}`
                                        : '자유 합주'}
                                </p>
                            </div>
                        </div>

                        {eligibleJams.length > 1 && (
                            <div className="shrink-0 max-w-[130px] sm:max-w-[160px]">
                                <select
                                    value={selectedJam?.bnNo || ''}
                                    onChange={(e) => {
                                        const found = eligibleJams.find(
                                            (j) => String(j.bnNo) === e.target.value
                                        );
                                        if (found) setSelectedJam(found);
                                    }}
                                    className="w-full text-[11px] font-bold px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none truncate"
                                >
                                    {eligibleJams.map((j) => (
                                        <option key={j.bnNo} value={j.bnNo}>
                                            {j.bnNm} ({j.bnConfFg === 'Y' ? '확정' : '진행'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 일정 시간표 헤더 및 시간표 요약 */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-row justify-between items-center px-1">
                        <h3 className="text-[18px] font-bold leading-[26px] text-[#0B1114]">
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

                    {/* 상태 구분 범례 바 (라인 없는 순수 색상 블록) */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#525252] bg-[#F8FAFC] px-3.5 py-2.5 rounded-[10px] border border-[#EBECEF]">
                        <div className="flex items-center gap-1 font-medium">
                            <span className="text-gray-500">동방:</span>
                            <span className="font-bold text-[#0B1114]">1실</span>
                        </div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-[3px] bg-white border border-gray-300 inline-block shadow-2xs" />
                                <span className="text-[11px] text-gray-700">예약 가능</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-[3px] bg-[#00BDF8] inline-block shadow-2xs" />
                                <span className="text-[11px] font-bold text-[#0098CC]">선택 중</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-[3px] bg-[#2EE59D] inline-block shadow-2xs" />
                                <span className="text-[11px] font-bold text-[#1eb375]">예약 완료</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-[3px] bg-[#E2E8F0] inline-block shadow-2xs" />
                                <span className="text-[11px] font-medium text-gray-400">지난 일정</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. 일정 시간표 그리드 테이블 (내부 라인 제거, 순수 색상 블록, 취소 드래그 완벽 지원) */}
                    <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-3 shadow-xs select-none">
                        <div
                            ref={gridContainerRef}
                            className="w-full overflow-x-auto select-none touch-none"
                            style={{ touchAction: 'none', userSelect: 'none' }}
                        >
                            <table className="w-full border-collapse text-center select-none">
                                {/* Date Columns Header */}
                                <thead>
                                    <tr className="border-b border-[#E5E5E5]">
                                        <th className="w-[44px] py-2 text-[12px] font-medium text-[#525252] bg-white sticky left-0 z-10">
                                            KST
                                        </th>
                                        {weekDays.map((d, idx) => {
                                            const { dateStr, dayName } = formatShortDate(d);
                                            const isSunday = d.getDay() === 0;
                                            const isSaturday = d.getDay() === 6;
                                            return (
                                                <th
                                                    key={idx}
                                                    className="min-w-[40px] py-1.5 px-0.5 text-center font-medium bg-white"
                                                >
                                                    <div className="text-[12px] text-[#0B1114] leading-tight font-semibold">
                                                        {dateStr}
                                                    </div>
                                                    <div
                                                        className={`text-[11px] leading-tight ${
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

                                {/* Time Rows (08:00 ~ 22:00) */}
                                <tbody>
                                    {timeHours.map((hour) => {
                                        const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                                        return (
                                            <tr key={hour} className="h-[34px]">
                                                {/* 세로 시간 라벨 */}
                                                <td className="text-[11px] font-medium text-[#737373] bg-white sticky left-0 z-10 select-none cursor-default">
                                                    {hourLabel}
                                                </td>

                                                {/* 각 일자별 셀 (라인 없음, 순수 색상 표시) */}
                                                {weekDays.map((d, colIdx) => {
                                                    const dateStr = formatDateToYMD(d);
                                                    const slotKey = `${dateStr}_${String(hour).padStart(2, '0')}00`;
                                                    const isSelected = selectedSlots.has(slotKey);
                                                    const reservation = getSlotReservation(dateStr, hour);
                                                    const past = isSlotPast(dateStr, hour);

                                                    // 셀 배경 색상 결정
                                                    let cellBg = '#FFFFFF';
                                                    let cursorStyle = 'cursor-pointer';

                                                    if (isSelected) {
                                                        // 선택 중 -> 하늘색 (#00BDF8)
                                                        cellBg = '#00BDF8';
                                                    } else if (reservation) {
                                                        // 예약 완료 슬롯 -> 초록색 (#2EE59D)
                                                        cellBg = '#2EE59D';
                                                    } else if (past) {
                                                        // 지난 일정 -> 회색 (#E2E8F0)
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
                                                            onTouchStart={(e) =>
                                                                handleCellTouchStart(dateStr, hour, e)
                                                            }
                                                            className={`p-0 h-[34px] transition-colors relative select-none touch-none ${cursorStyle}`}
                                                            style={{
                                                                backgroundColor: cellBg,
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
                        드래그하여 시간을 선택하거나 취소할 수 있습니다.
                    </p>
                </div>

                {/* 4. 이번 주 예약 현황 목록 (펼치기 / 닫기 툴바 형식) */}
                <div className="bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden shadow-xs">
                    {/* Toolbar Header (Click to toggle expand/collapse) */}
                    <button
                        type="button"
                        onClick={() => setIsWeekListOpen((prev) => !prev)}
                        className="w-full px-4 py-3 bg-[#F8FAFC] hover:bg-gray-100/80 flex items-center justify-between transition-colors cursor-pointer select-none text-left"
                    >
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-[#00BDF8]" size={13} />
                            <span className="text-[14px] font-bold text-gray-900">
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
                        <div className="p-3 border-t border-gray-100">
                            {weekSchedules.length > 0 ? (
                                <div className="divide-y divide-gray-100 max-h-[260px] overflow-y-auto space-y-0.5">
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
                                                className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-gray-50/70 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div className="w-1 self-stretch bg-[#00BDF8] rounded-full min-h-[36px] shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-sky-50 text-[#0098CC] border border-sky-100">
                                                                {m}/{d}({dayName}) {sch.schSttTime.slice(0, 2)}:00 ~ {sch.schEndTime.slice(0, 2)}:00
                                                            </span>
                                                            <span className="text-[13px] font-bold text-gray-900 truncate">
                                                                {sch.bnNm}
                                                            </span>
                                                            {sch.bnSongNm && (
                                                                <span className="text-[11px] text-gray-500 truncate">
                                                                    ({sch.bnSongNm})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            예약자: {sch.userNickNm || sch.insId}
                                                        </p>
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

                {/* 5. 예약 완료 및 초기화 버튼 */}
                <div className="flex flex-col gap-2 pt-1">
                    <button
                        onClick={handleSubmitReservation}
                        disabled={selectedSlots.size === 0 || isSubmitting || !selectedJam}
                        className="w-full h-[52px] bg-[#00BDF8] hover:bg-[#00a8dc] active:scale-[0.99] text-white text-[15px] font-bold rounded-[12px] flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(0,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSubmitting ? '예약 저장 중...' : '동방 일정 예약 저장'}
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
