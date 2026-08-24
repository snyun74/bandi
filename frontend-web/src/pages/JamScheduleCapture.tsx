import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaTrashAlt } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface ScheduleDto {
    bnSchNo: number;
    bnNo: number;
    title: string;
    startDate: string; // YYYYMMDD
    startTime: string; // HHMM00
    endDate: string;
    endTime: string;
    userId: string;
    userNickNm?: string;
}

interface ConfirmedScheduleDto {
    schNo: number;
    bnNo: number;
    title: string;
    content?: string;
    sttDate: string; // YYYYMMDD
    sttTime: string; // HHMM or HHMMSS
    endDate: string; // YYYYMMDD
    endTime: string; // HHMM or HHMMSS
    allDayYn?: string;
    statCd?: string;
    userId?: string;
}

interface BandRole {
    sessionNo?: number;
    sessionTypeCd?: string;
    part?: string;
    user?: string;
    userId?: string;
    status?: string;
}

interface BandInfo {
    id?: number;
    title: string;
    artist: string;
    imgUrl?: string;
    isLeader?: boolean;
    canManage?: boolean;
    roles: BandRole[];
}

const JamScheduleCapture: React.FC = () => {
    const navigate = useNavigate();
    const { jamId } = useParams<{ jamId: string }>();
    const userId = localStorage.getItem('userId') || '';

    // 모드 탭: 'INPUT' (가능시간 조회/입력) | 'STATUS' (조율 현황)
    const [activeTab, setActiveTab] = useState<'INPUT' | 'STATUS'>('INPUT');

    // 일정 시간 조회 모드 vs 수정 모드 (기본: 조회 모드)
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    // 원본 저장된 내 슬롯 (취소용 백업)
    const [savedSlotsBackup, setSavedSlotsBackup] = useState<Set<string>>(new Set());

    // 합주 정보 및 참여자 세션
    const [bandInfo, setBandInfo] = useState<BandInfo>({
        title: "합주실",
        artist: "아티스트",
        roles: []
    });

    // 전체 조율 스케줄 목록
    const [schedules, setSchedules] = useState<ScheduleDto[]>([]);

    // 최종 확정된 합주 일정 목록 (BN_SCHEDULE)
    const [confirmedSchedules, setConfirmedSchedules] = useState<ConfirmedScheduleDto[]>([]);

    // 탭 1 기준 날짜 (기본 오늘)
    const [currentBaseDate, setCurrentBaseDate] = useState<Date>(new Date());

    // 탭 2 캘린더 월 기준 날짜
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

    // 탭 2 선택된 일자 ('YYYYMMDD')
    const [selectedMatchDate, setSelectedMatchDate] = useState<string>('');

    // 탭 2 선택된 확정 시간 슬롯 목록 (연속된 시간대)
    const [selectedConfirmedHours, setSelectedConfirmedHours] = useState<number[]>([]);

    // 탭 2 확정 합주일정 제목 입력
    const [scheduleTitle, setScheduleTitle] = useState<string>('');

    // 내가 선택한 시간 슬롯: Set of "YYYYMMDD_HH00"
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

    // 하단 참여 현황에 표시할 선택된 시간 슬롯 (기본: 오늘 19:00 또는 첫 번째 슬롯)
    const [focusedSlot, setFocusedSlot] = useState<{ date: string; hour: number }>({
        date: '',
        hour: 19
    });

    // 모달 상태
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

    const showAlert = (message: string) => {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: closeModal,
        });
    };

    // 시간대 정의: 08:00 ~ 22:00 (15시간대)
    const timeHours = Array.from({ length: 15 }, (_, i) => i + 8); // 8, 9, ..., 22

    // 주간 일자 계산 (일요일 시작 7일)
    const getWeekDays = (base: Date) => {
        const d = new Date(base);
        const dayOfWeek = d.getDay(); // 0(일) ~ 6(토)
        const diff = d.getDate() - dayOfWeek;
        const sunday = new Date(d.setDate(diff));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(sunday);
            next.setDate(sunday.getDate() + i);
            week.push(next);
        }
        return week;
    };

    const weekDays = getWeekDays(currentBaseDate);

    const formatDateToYMD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    };

    const formatShortDate = (d: Date) => {
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const name = dayNames[d.getDay()];
        return {
            dateStr: `${m}/${day}`,
            dayName: name
        };
    };

    // 주차 변경 핸들러 (탭 1)
    const handlePrevWeek = () => {
        const next = new Date(currentBaseDate);
        next.setDate(currentBaseDate.getDate() - 7);
        setCurrentBaseDate(next);
    };

    const handleNextWeek = () => {
        const next = new Date(currentBaseDate);
        next.setDate(currentBaseDate.getDate() + 7);
        setCurrentBaseDate(next);
    };

    // 월 변경 핸들러 (탭 2)
    const handlePrevMonth = () => {
        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        setCalendarMonth(next);
    };

    const handleNextMonth = () => {
        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        setCalendarMonth(next);
    };

    // 데이터 조회
    useEffect(() => {
        if (!jamId) return;
        fetchBandInfo();
        fetchSchedules();
        fetchConfirmedSchedules();
    }, [jamId]);

    // 초기 포커스 슬롯 설정
    useEffect(() => {
        if (weekDays.length > 0 && !focusedSlot.date) {
            setFocusedSlot({
                date: formatDateToYMD(weekDays[0]),
                hour: 19
            });
        }
    }, [currentBaseDate]);

    const fetchBandInfo = async () => {
        if (!jamId) return;
        try {
            const response = await fetch(`/api/bands/${jamId}?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setBandInfo({
                    id: data.id,
                    title: data.title || "합주실",
                    artist: data.artist || "아티스트",
                    imgUrl: data.imgUrl,
                    isLeader: data.isLeader,
                    canManage: data.canManage,
                    roles: data.roles || []
                });
            }
        } catch (error) {
            console.error("Failed to fetch band info", error);
        }
    };

    const fetchSchedules = async () => {
        if (!jamId) return;
        try {
            const response = await fetch(`/api/bands/${jamId}/schedules`);
            if (response.ok) {
                const data: ScheduleDto[] = await response.json();
                setSchedules(data);

                // 내 기존 선택 슬롯 불러오기
                const mySlots = new Set<string>();
                data.filter(s => s.userId === userId).forEach(s => {
                    const hour = parseInt(s.startTime.substring(0, 2), 10);
                    const slotKey = `${s.startDate}_${String(hour).padStart(2, '0')}00`;
                    mySlots.add(slotKey);
                });
                setSelectedSlots(mySlots);
                setSavedSlotsBackup(new Set(mySlots));
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        }
    };

    const fetchConfirmedSchedules = async () => {
        if (!jamId) return;
        try {
            const response = await fetch(`/api/bands/${jamId}/confirmed-schedules`);
            if (response.ok) {
                const data: ConfirmedScheduleDto[] = await response.json();
                setConfirmedSchedules(data);
            }
        } catch (error) {
            console.error("Failed to fetch confirmed schedules", error);
        }
    };

    // --- 드래그 / 클릭 다중 선택 로직 (탭 1) ---
    const isDragging = useRef(false);
    const initialAction = useRef<'select' | 'deselect'>('select');
    const justTouched = useRef(false);
    const gridContainerRef = useRef<HTMLDivElement>(null);

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

    // 모바일/터치 드래그 시 브라우저 전체 스크롤 완전 차단 (수정 모드일 때만 동작)
    useEffect(() => {
        const el = gridContainerRef.current;
        if (!el || !isEditMode) return;

        const onTouchMoveNative = (e: TouchEvent) => {
            if (isEditMode && isDragging.current) {
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
    }, [isEditMode, weekDays, selectedSlots]);

    const toggleSlot = (dateStr: string, hour: number, forceAction?: 'select' | 'deselect') => {
        // 수정 모드가 아닐 때는 포커스(참여자 조회)만 변경하고 선택 슬롯은 건드리지 않음!
        if (!isEditMode) {
            setFocusedSlot({ date: dateStr, hour });
            return;
        }

        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        setSelectedSlots(prev => {
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

        // 포커스 슬롯 갱신
        setFocusedSlot({ date: dateStr, hour });
    };

    const handleCellMouseDown = (dateStr: string, hour: number, e: React.MouseEvent) => {
        if (justTouched.current) return;

        if (!isEditMode) {
            // 조회 모드: 포커스만 변경
            setFocusedSlot({ date: dateStr, hour });
            return;
        }

        e.preventDefault();
        isDragging.current = true;
        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        const isSelected = selectedSlots.has(key);
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellMouseEnter = (dateStr: string, hour: number) => {
        if (!isEditMode || !isDragging.current) return;
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleCellTouchStart = (dateStr: string, hour: number, e: React.TouchEvent) => {
        justTouched.current = true;
        setTimeout(() => { justTouched.current = false; }, 500);

        if (!isEditMode) {
            // 조회 모드: 포커스만 변경
            setFocusedSlot({ date: dateStr, hour });
            return;
        }

        isDragging.current = true;
        const key = `${dateStr}_${String(hour).padStart(2, '0')}00`;
        const isSelected = selectedSlots.has(key);
        initialAction.current = isSelected ? 'deselect' : 'select';
        toggleSlot(dateStr, hour, initialAction.current);
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
    };

    // 선택 요약 계산 (X개 날짜 · 총 Y시간 선택)
    const getSelectionSummary = () => {
        const dates = new Set<string>();
        selectedSlots.forEach(k => {
            const [d] = k.split('_');
            dates.add(d);
        });
        const totalHours = selectedSlots.size;
        if (totalHours === 0) return "선택된 시간 없음";
        return `${dates.size}개 날짜 · 총 ${totalHours}시간 선택`;
    };

    // 특정 슬롯의 다른 참여자 수 및 참여자 목록 계산 (현재 내가 선택/해제한 상태 실시간 반영)
    const getSlotParticipants = (dateStr: string, hour: number) => {
        const hourPrefix = String(hour).padStart(2, '0');
        const slotKey = `${dateStr}_${hourPrefix}00`;

        // 다른 사용자들이 등록한 스케줄 목록 (내 기존 스케줄 제외)
        const otherUserIds = schedules
            .filter(s => s.startDate === dateStr && s.startTime.substring(0, 2) === hourPrefix && s.userId !== userId)
            .map(s => s.userId)
            .filter(Boolean);

        const currentUsersSet = new Set<string>(otherUserIds);

        // 현재 내가 이 슬롯을 선택한 상태라면 내 아이디 추가 (처음 선택 시 1명으로 연한 색상 즉시 반영)
        if (selectedSlots.has(slotKey) && userId) {
            currentUsersSet.add(userId);
        }

        const userIds = Array.from(currentUsersSet);
        return {
            count: userIds.length,
            userIds
        };
    };

    // 세션에 참여 중인 모든 멤버 아이디 목록
    const sessionJoinedUserIds = Array.from(
        new Set(bandInfo.roles.filter(r => r.userId).map(r => r.userId!))
    );

    // 스케줄을 등록한 전체 고유 유저 수 (세션 목록이 없을 경우 대비)
    const allScheduleUserIds = Array.from(new Set(schedules.map(s => s.userId).filter(Boolean)));
    const totalSessionCount = sessionJoinedUserIds.length > 0
        ? sessionJoinedUserIds.length
        : (allScheduleUserIds.length > 0 ? allScheduleUserIds.length : 1);

    // 슬롯별 참여 인원수 및 색상 스타일 계산
    // 1. 세션수 만큼 모두 참여한 경우: #2EE59D
    // 2. 세션수 - 1 만큼 참여한 경우: #00BDF8
    // 3. 1명부터 (세션수 - 2)명까지: #00BDF8보다 연한 색으로 단계별 계산 (1명: 아주 연한색 -> 점진적으로 진해짐)
    const getSlotColorInfo = (dateStr: string, hour: number) => {
        const { userIds } = getSlotParticipants(dateStr, hour);

        // 세션 참여자 중 해당 슬롯에 가능한 인원 수 계산
        const matchedCount = sessionJoinedUserIds.length > 0
            ? userIds.filter(uid => sessionJoinedUserIds.includes(uid)).length
            : userIds.length;

        if (matchedCount === 0) {
            return {
                bg: '#FFFFFF',
                text: '#94A3B8',
                matchedCount: 0,
                isFull: false
            };
        }

        // 1. 세션수만큼 모두 참여한 경우 -> #2EE59D
        if (totalSessionCount > 0 && matchedCount >= totalSessionCount) {
            return {
                bg: '#2EE59D',
                text: '#FFFFFF',
                matchedCount,
                isFull: true
            };
        }

        // 2. 세션수 - 1 만큼 참여한 경우 -> #00BDF8
        if (matchedCount >= totalSessionCount - 1) {
            return {
                bg: '#00BDF8',
                text: '#FFFFFF',
                matchedCount,
                isFull: false
            };
        }

        // 3. 1명부터 (세션수 - 2)명까지는 #00BDF8보다 연한 색으로 단계별 계산
        const maxStep = Math.max(1, totalSessionCount - 1);
        const minAlpha = 0.20; // 1명일 때 아주 연한 하늘색
        const maxSubAlpha = 0.75; // (세션수 - 2)명일 때의 알파값
        const progress = maxStep <= 2 ? 0 : (matchedCount - 1) / (maxStep - 2);
        const alpha = minAlpha + (maxSubAlpha - minAlpha) * progress;

        // #00BDF8 (0, 189, 248) 색상을 흰색(#FFFFFF) 배경과 알파 블렌딩
        const r = Math.round(255 * (1 - alpha) + 0 * alpha);
        const g = Math.round(255 * (1 - alpha) + 189 * alpha);
        const b = Math.round(255 * (1 - alpha) + 248 * alpha);
        const bg = `rgb(${r}, ${g}, ${b})`;

        return {
            bg,
            text: alpha > 0.5 ? '#FFFFFF' : '#0098CC',
            matchedCount,
            isFull: false
        };
    };

    // 가능 시간 제출 저장 API 호출
    const handleSubmitAvailability = async () => {
        if (!userId) {
            showAlert("로그인이 필요합니다.");
            return;
        }
        if (!jamId) return;

        const slots = Array.from(selectedSlots).map(k => {
            const [date, time] = k.split('_');
            return { date, time };
        });

        try {
            const response = await fetch('/api/bands/schedule/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bnNo: Number(jamId),
                    userId: userId,
                    slots: slots
                })
            });

            if (response.ok) {
                showAlert("가능 시간이 성공적으로 저장되었습니다! 🎉");
                setIsEditMode(false);
                setSavedSlotsBackup(new Set(selectedSlots));
                fetchSchedules();
            } else {
                const err = await response.text();
                showAlert(`저장에 실패했습니다: ${err}`);
            }
        } catch (error) {
            console.error("Failed to submit plan schedule", error);
            showAlert("네트워크 오류로 저장에 실패했습니다.");
        }
    };

    // 현재 포커스된 슬롯의 가능한 사람 / 불가능한 사람 계산
    const calculatePeopleStatus = () => {
        if (!focusedSlot.date) return { available: [], unavailable: [] };

        const { userIds: availableIds } = getSlotParticipants(focusedSlot.date, focusedSlot.hour);
        const availableSet = new Set(availableIds);

        // 합주 세션에 참여 중인 멤버들 기준
        const sessionMembers = bandInfo.roles
            .filter(r => r.userId)
            .map(r => ({
                userId: r.userId!,
                name: r.user || '멤버',
                part: r.part || '세션'
            }));

        // 세션 목록에서 중복 제거
        const uniqueMembersMap = new Map<string, { userId: string; name: string; part: string }>();
        sessionMembers.forEach(m => {
            if (!uniqueMembersMap.has(m.userId)) {
                uniqueMembersMap.set(m.userId, m);
            }
        });

        // 만약 세션 참여자 외에 스케줄을 등록한 유저가 있다면 추가
        schedules.forEach(s => {
            if (s.userId && !uniqueMembersMap.has(s.userId)) {
                uniqueMembersMap.set(s.userId, {
                    userId: s.userId,
                    name: s.userNickNm || s.userId,
                    part: '멤버'
                });
            }
        });

        const allMembers = Array.from(uniqueMembersMap.values());
        const available = allMembers.filter(m => availableSet.has(m.userId));
        const unavailable = allMembers.filter(m => !availableSet.has(m.userId));

        return { available, unavailable };
    };

    const { available: availablePeople, unavailable: unavailablePeople } = calculatePeopleStatus();

    // 포커스된 시간 라벨 포맷 (예: "7/27 19:00" 또는 "19:00")
    const getFocusedSlotTitle = () => {
        if (!focusedSlot.date) return `${String(focusedSlot.hour).padStart(2, '0')}:00`;
        const m = parseInt(focusedSlot.date.substring(4, 6), 10);
        const d = parseInt(focusedSlot.date.substring(6, 8), 10);
        return `${m}/${d} ${String(focusedSlot.hour).padStart(2, '0')}:00`;
    };

    // =========================================================================
    // 탭 2: 조율 현황 로직 (모든 세션 참여자 교집합 계산 및 최종 확정)
    // =========================================================================

    // 특정 날짜에 모든 세션 참여자가 동시에 가능한 시간대 목록 계산
    const getAllMatchingHoursForDate = (dateStr: string) => {
        if (sessionJoinedUserIds.length === 0) return [];

        const matchingHours: number[] = [];
        timeHours.forEach(hour => {
            const { userIds } = getSlotParticipants(dateStr, hour);
            const isAllMatch = sessionJoinedUserIds.every(uid => userIds.includes(uid));
            if (isAllMatch) {
                matchingHours.push(hour);
            }
        });
        return matchingHours;
    };

    // 모든 세션 참여자가 동시에 가능한 일자 목록(Set)
    const getAllMatchingDatesSet = () => {
        if (sessionJoinedUserIds.length === 0) return new Set<string>();

        const dates = new Set<string>();
        schedules.forEach(s => {
            const d = s.startDate;
            if (!dates.has(d)) {
                const hours = getAllMatchingHoursForDate(d);
                if (hours.length > 0) {
                    dates.add(d);
                }
            }
        });
        return dates;
    };

    const allMatchingDatesSet = getAllMatchingDatesSet();

    // 탭 2 캘린더 그리드 날짜 생성
    const getCalendarDays = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const todayStr = formatDateToYMD(new Date());

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
        const totalDays = lastDayOfMonth.getDate();

        const days = [];

        // 이전 달 빈 칸
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // 현재 달 일자들
        for (let d = 1; d <= totalDays; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = formatDateToYMD(dateObj);
            const isMatch = allMatchingDatesSet.has(dateStr);
            const isPast = dateStr < todayStr;
            days.push({
                day: d,
                dateStr,
                isMatch,
                isPast
            });
        }

        return days;
    };

    const calendarDays = getCalendarDays();

    // 탭 2: 연속된 시간대 선택 핸들러
    const handleToggleConfirmedHour = (hour: number) => {
        setSelectedConfirmedHours(prev => {
            if (prev.length === 0) {
                return [hour];
            }

            if (prev.includes(hour)) {
                // 이미 포함되어 있는 경우
                if (prev.length === 1) {
                    return [];
                }
                const min = Math.min(...prev);
                const max = Math.max(...prev);
                if (hour === min) {
                    return prev.filter(h => h !== hour);
                } else if (hour === max) {
                    return prev.filter(h => h !== hour);
                } else {
                    // 중간을 해제하려고 하면 그 시간 하나만 새로 선택
                    return [hour];
                }
            }

            // 새로 추가하는 경우: 반드시 기존 선택의 min - 1 또는 max + 1 이어야 연속됨!
            const min = Math.min(...prev);
            const max = Math.max(...prev);

            if (hour === min - 1 || hour === max + 1) {
                const next = [...prev, hour].sort((a, b) => a - b);
                return next;
            } else {
                // 연속되지 않은 떨어진 시간을 누르면 그 시간부터 새로 시작
                return [hour];
            }
        });
    };

    // 탭 2: 합주 일정 최종 확정 저장 API 호출 (BN_SCHEDULE)
    const handleConfirmScheduleSubmit = async () => {
        if (!bandInfo.canManage && !bandInfo.isLeader) {
            showAlert("합주 일정 최종 확정은 방장 및 클랜 간부만 가능합니다.");
            return;
        }

        if (!selectedMatchDate) {
            showAlert("캘린더에서 확정할 일자를 먼저 선택해주세요.");
            return;
        }

        const todayStr = formatDateToYMD(new Date());
        if (selectedMatchDate < todayStr) {
            showAlert("오늘 이전의 지난 일자로는 합주 일정을 확정할 수 없습니다.\n오늘 이후의 일자를 선택해주세요.");
            return;
        }

        if (selectedConfirmedHours.length === 0) {
            showAlert("모두가 참석 가능한 시간대를 1개 이상 선택해주세요.");
            return;
        }

        const sortedHours = [...selectedConfirmedHours].sort((a, b) => a - b);
        const sttH = sortedHours[0];
        const endH = sortedHours[sortedHours.length - 1] + 1; // 1시간 단위 종료시

        const sttTime = String(sttH).padStart(2, '0') + "00";
        const endTime = String(endH).padStart(2, '0') + "00";
        const title = scheduleTitle.trim() ? scheduleTitle.trim() : `${bandInfo.title} 합주 일정`;

        try {
            const response = await fetch(`/api/bands/${jamId}/confirmed-schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bnNo: Number(jamId),
                    title: title,
                    sttDate: selectedMatchDate,
                    sttTime: sttTime,
                    endDate: selectedMatchDate,
                    endTime: endTime,
                    userId: userId
                })
            });

            if (response.ok) {
                showAlert("합주 일정이 최종 확정되었습니다! 🎉\n홈 화면 다가오는 예약 및 일정에 반영됩니다.");
                setSelectedConfirmedHours([]);
                setScheduleTitle('');
                fetchConfirmedSchedules();
            } else {
                const err = await response.text();
                showAlert(`확정 저장에 실패했습니다: ${err}`);
            }
        } catch (error) {
            console.error("Failed to confirm schedule", error);
            showAlert("네트워크 오류로 저장에 실패했습니다.");
        }
    };

    // 탭 2: 확정된 합주 일정 삭제 API 호출
    const handleDeleteConfirmedSchedule = (schNo: number, title: string) => {
        if (!bandInfo.canManage && !bandInfo.isLeader) {
            showAlert("삭제 권한이 없습니다. (방장 또는 클랜 간부만 가능)");
            return;
        }

        setModalConfig({
            isOpen: true,
            type: 'confirm',
            message: `[${title}]\n확정된 합주 일정을 완전히 삭제하시겠습니까?`,
            onConfirm: async () => {
                closeModal();
                try {
                    const response = await fetch(`/api/bands/${jamId}/confirmed-schedules/${schNo}?userId=${userId}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        showAlert("확정 일정이 삭제되었습니다.");
                        fetchConfirmedSchedules();
                    } else {
                        const err = await response.text();
                        showAlert(`삭제 실패: ${err}`);
                    }
                } catch (error) {
                    console.error("Failed to delete confirmed schedule", error);
                    showAlert("네트워크 오류로 삭제에 실패했습니다.");
                }
            }
        });
    };

    // 날짜 포맷 헬퍼 (YYYYMMDD -> YYYY.MM.DD (요일))
    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 8) return dateStr;
        const y = dateStr.substring(0, 4);
        const m = parseInt(dateStr.substring(4, 6), 10);
        const d = parseInt(dateStr.substring(6, 8), 10);
        const dateObj = new Date(parseInt(y, 10), m - 1, d);
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[dateObj.getDay()];
        return `${y}.${m}.${d} (${dayName})`;
    };

    const formatDisplayTimeRange = (sttTime: string, endTime: string) => {
        if (!sttTime || sttTime.length < 2) return "";
        const stt = sttTime.substring(0, 2) + ":00";
        const end = endTime && endTime.length >= 2 ? endTime.substring(0, 2) + ":00" : "";
        return end ? `${stt} ~ ${end}` : stt;
    };

    return (
        <div className="min-h-screen bg-[#FAFBFD] font-['Inter','Pretendard',sans-serif] text-[#0B1114] pb-16 selection:bg-[#00BDF8] selection:text-white">
            {/* 상단 네비게이션 헤더 */}
            <div className="max-w-[420px] mx-auto sticky top-0 z-30 bg-[#FAFBFD]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200/60 active:scale-90 transition-all cursor-pointer"
                >
                    <FaChevronLeft size={18} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-[16px] font-bold text-[#0B1114] truncate max-w-[240px]">
                        {bandInfo.title}
                    </h1>
                    <span className="text-[12px] text-gray-500 font-medium">
                        {bandInfo.artist} · 일정 조율
                    </span>
                </div>
                <div className="w-9" />
            </div>

            <div className="max-w-[420px] mx-auto px-5 pt-4 flex flex-col gap-6">

                {/* Section / Schedule Intro */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-[20px] font-bold leading-[28px] text-[#0B1114]">
                        {activeTab === 'INPUT'
                            ? (isEditMode ? "가능한 날짜와 시간을 선택해주세요" : "합주 일정 가능시간 조회")
                            : "모두가 가능한 시간을 확인해보세요"}
                    </h2>
                    <p className="text-[14px] leading-[22px] text-[#525252]">
                        {activeTab === 'INPUT'
                            ? (isEditMode
                                ? "시간표를 드래그하거나 터치해 가능한 시간을 선택하세요."
                                : "시간표를 터치하면 해당 시간의 참여자/불참자를 확인할 수 있어요.")
                            : "날짜와 시간대를 선택하면 멤버별 가능 여부를 볼 수 있어요."}
                    </p>
                </div>

                {/* Section / Schedule Mode Tabs */}
                <div className="flex flex-row gap-2 h-[44px]">
                    <button
                        onClick={() => setActiveTab('INPUT')}
                        className={`flex-1 h-[44px] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-all cursor-pointer ${
                            activeTab === 'INPUT'
                                ? 'bg-[#00BDF8] text-white shadow-[0_4px_12px_rgba(0,189,248,0.25)]'
                                : 'bg-white border border-[#E5E5E5] text-[#525252] hover:bg-gray-50'
                        }`}
                    >
                        {isEditMode ? "가능시간 수정" : "가능시간 입력"}
                    </button>
                    <button
                        onClick={() => setActiveTab('STATUS')}
                        className={`flex-1 h-[44px] rounded-[12px] font-bold text-[14px] flex items-center justify-center transition-all cursor-pointer ${
                            activeTab === 'STATUS'
                                ? 'bg-[#00BDF8] text-white shadow-[0_4px_12px_rgba(0,189,248,0.25)]'
                                : 'bg-white border border-[#E5E5E5] text-[#525252] hover:bg-gray-50'
                        }`}
                    >
                        조율 현황
                    </button>
                </div>

                {activeTab === 'INPUT' ? (
                    /* ========================================================================= */
                    /* Tab 1. 가능시간 조회 & 입력 모드 */
                    /* ========================================================================= */
                    <>
                        {/* Section / Availability Grid Section */}
                        <div className="flex flex-col gap-3">
                            {/* Availability Header */}
                            <div className="flex flex-row justify-between items-center">
                                <h3 className="text-[16px] font-semibold leading-[24px] text-[#0B1114]">
                                    {isEditMode ? "가능한 시간 선택" : "일정 시간표"}
                                </h3>
                                <span className="text-[12px] font-medium text-[#0098CC]">
                                    {getSelectionSummary()}
                                </span>
                            </div>

                            {/* 주차 이동 바 */}
                            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[10px] border border-[#E5E5E5] text-[13px] text-gray-700 font-medium">
                                <button
                                    onClick={handlePrevWeek}
                                    className="p-1 hover:text-[#00BDF8] active:scale-90 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <FaChevronLeft size={12} />
                                    <span>이전 주</span>
                                </button>
                                <span className="font-bold text-[#0B1114]">
                                    {weekDays[0].getMonth() + 1}/{weekDays[0].getDate()} ~ {weekDays[6].getMonth() + 1}/{weekDays[6].getDate()}
                                </span>
                                <button
                                    onClick={handleNextWeek}
                                    className="p-1 hover:text-[#00BDF8] active:scale-90 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>다음 주</span>
                                    <FaChevronRight size={12} />
                                </button>
                            </div>

                            {/* 색상 단계 안내 범례 (조회 모드: 참여 인원수별 색상 / 수정 모드: 내 가능 시간 안내) */}
                            {isEditMode ? (
                                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#525252] bg-[#F0F9FF] px-3.5 py-2 rounded-[10px] border border-[#BAE6FD]">
                                    <div className="flex items-center gap-1.5 font-medium text-[#0098CC]">
                                        <span className="w-2 h-2 rounded-full bg-[#00BDF8] animate-pulse" />
                                        <span className="font-bold">내 일정 수정 모드</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#00BDF8] inline-block shadow-2xs" />
                                            <span className="text-[11px] font-semibold text-[#0098CC]">내 가능 시간</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-[3px] bg-white border border-gray-300 inline-block shadow-2xs" />
                                            <span className="text-[11px] text-gray-500">선택 안 됨</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#525252] bg-[#F8FAFC] px-3.5 py-2 rounded-[10px] border border-[#EBECEF]">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <span className="text-gray-500">세션 총 인원:</span>
                                        <span className="font-bold text-[#0B1114]">{totalSessionCount}명</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#D6F5FE] border border-[#BAE6FD] inline-block shadow-2xs" />
                                            <span className="text-[11px]">1명 (연한색)</span>
                                        </div>
                                        {totalSessionCount > 2 && (
                                            <div className="flex items-center gap-1">
                                                <span className="w-3.5 h-3.5 rounded-[3px] bg-[#00BDF8] inline-block shadow-2xs" />
                                                <span className="text-[11px] font-medium text-[#0098CC]">{totalSessionCount - 1}명</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#2EE59D] inline-block shadow-2xs" />
                                            <span className="text-[11px] font-bold text-[#1eb375]">
                                                {totalSessionCount}명 전원
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Availability Grid Card */}
                            <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-3 shadow-xs select-none">
                                <div 
                                    ref={gridContainerRef}
                                    className={`w-full overflow-x-auto select-none ${isEditMode ? 'touch-none' : 'touch-pan-y'}`}
                                    style={{ touchAction: isEditMode ? 'none' : 'pan-y pan-x' }}
                                >
                                    <table className="w-full border-collapse text-center select-none">
                                        {/* Date Columns Header */}
                                        <thead>
                                            <tr className="border-b border-[#E5E5E5]">
                                                <th className="w-[44px] py-2 text-[12px] font-medium text-[#525252] bg-white sticky left-0 z-10 touch-pan-y">
                                                    KST
                                                </th>
                                                {weekDays.map((d, idx) => {
                                                    const { dateStr, dayName } = formatShortDate(d);
                                                    const isSunday = d.getDay() === 0;
                                                    const isSaturday = d.getDay() === 6;
                                                    return (
                                                        <th key={idx} className="min-w-[40px] py-1.5 px-0.5 text-center font-medium bg-white">
                                                            <div className="text-[12px] text-[#0B1114] leading-tight font-semibold">
                                                                {dateStr}
                                                            </div>
                                                            <div className={`text-[11px] leading-tight ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-[#737373]'}`}>
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
                                                        <td className="text-[11px] font-medium text-[#737373] bg-white sticky left-0 z-10 select-none touch-pan-y cursor-default">
                                                            {hourLabel}
                                                        </td>

                                                        {/* 각 일자별 셀 (수정 모드: 내 선택 여부 / 조회 모드: 전원 참여 히트맵) */}
                                                        {weekDays.map((d, colIdx) => {
                                                            const dateStr = formatDateToYMD(d);
                                                            const slotKey = `${dateStr}_${String(hour).padStart(2, '0')}00`;
                                                            const isMySelected = selectedSlots.has(slotKey);
                                                            const isFocused = focusedSlot.date === dateStr && focusedSlot.hour === hour;
                                                            const colorInfo = getSlotColorInfo(dateStr, hour);

                                                            // 수정 모드일 때는 내가 선택한 시간대만 명확하게 표시, 뷰 모드일 때는 전체 세션 참가자 색상 표시
                                                            const cellBg = isEditMode
                                                                ? (isMySelected ? '#00BDF8' : '#FFFFFF')
                                                                : colorInfo.bg;

                                                            return (
                                                                <td
                                                                    key={colIdx}
                                                                    data-slot-key={slotKey}
                                                                    data-date={dateStr}
                                                                    data-hour={hour}
                                                                    onClick={() => {
                                                                        if (!isEditMode) {
                                                                            setFocusedSlot({ date: dateStr, hour });
                                                                        }
                                                                    }}
                                                                    onMouseDown={(e) => handleCellMouseDown(dateStr, hour, e)}
                                                                    onMouseEnter={() => handleCellMouseEnter(dateStr, hour)}
                                                                    onTouchStart={(e) => handleCellTouchStart(dateStr, hour, e)}
                                                                    className={`p-0 h-[34px] cursor-pointer transition-colors relative select-none ${
                                                                        isEditMode ? 'border border-gray-100/70 touch-none' : 'touch-pan-y'
                                                                    } ${
                                                                        isFocused ? 'ring-2 ring-[#00BDF8] ring-inset z-10 rounded-[2px]' : ''
                                                                    }`}
                                                                    style={{
                                                                        backgroundColor: cellBg,
                                                                        touchAction: isEditMode ? 'none' : 'pan-y pan-x'
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

                            {/* Gesture Hint */}
                            <p className="text-[12px] leading-[18px] text-[#525252]">
                                {isEditMode
                                    ? "드래그해서 여러 시간을 한 번에 선택할 수 있어요."
                                    : "원하는 시간대를 터치하면 아래에서 참여/불참 멤버를 볼 수 있어요."}
                            </p>
                        </div>

                        {/* Section / Schedule Actions (조회 모드 vs 수정/저장 모드 버튼) */}
                        {!isEditMode ? (
                            <button
                                onClick={() => {
                                    setSavedSlotsBackup(new Set(selectedSlots));
                                    setIsEditMode(true);
                                }}
                                className="w-full h-[54px] bg-white border-2 border-[#00BDF8] hover:bg-[#00BDF8]/10 active:scale-[0.99] text-[#0098CC] text-[15px] font-bold rounded-[12px] flex items-center justify-center transition-all shadow-xs cursor-pointer"
                            >
                                클릭하여 시간 선택
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                <button
                                    onClick={handleSubmitAvailability}
                                    className="w-full h-[54px] bg-[#00BDF8] hover:bg-[#00a8dc] active:scale-[0.99] text-white text-[15px] font-bold rounded-[12px] flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(0,189,248,0.3)] cursor-pointer"
                                >
                                    일정 시간 저장
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedSlots(new Set(savedSlotsBackup));
                                        setIsEditMode(false);
                                    }}
                                    className="w-full py-1.5 text-center text-[13px] text-gray-500 hover:text-gray-700 underline cursor-pointer"
                                >
                                    수정 취소
                                </button>
                            </div>
                        )}

                        {/* Section / People Availability (선택된 시간의 참여 현황) */}
                        <div className="flex flex-col gap-3 pt-2">
                            {/* People Availability Header */}
                            <div className="flex flex-row justify-between items-center">
                                <h3 className="text-[16px] font-bold leading-[24px] text-[#0B1114]">
                                    {getFocusedSlotTitle()} 참여 현황
                                </h3>
                                <span className="text-[12px] text-gray-500">
                                    세션 참여자 기준
                                </span>
                            </div>

                            {/* People Availability Cards (좌: 가능한 사람 / 우: 불가능한 사람) */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Card / Available People */}
                                <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex flex-col gap-3 min-h-[160px] shadow-xs">
                                    <div className="flex flex-row justify-between items-center">
                                        <h4 className="text-[15px] font-bold leading-[22px] text-[#1EB980]">
                                            가능한 사람
                                        </h4>
                                        <span className="text-[12px] font-semibold text-[#1EB980]">
                                            {availablePeople.length}명
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {availablePeople.length > 0 ? (
                                            availablePeople.map((person, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#1EB980] flex-shrink-0" />
                                                    <span className="text-[13px] font-medium text-[#0B1114] truncate">
                                                        {person.name}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[12px] text-gray-400 font-medium mt-2">
                                                가능한 멤버가 없습니다
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card / Unavailable People */}
                                <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex flex-col gap-3 min-h-[160px] shadow-xs">
                                    <div className="flex flex-row justify-between items-center">
                                        <h4 className="text-[15px] font-bold leading-[22px] text-[#E45858]">
                                            불가능한 사람
                                        </h4>
                                        <span className="text-[12px] font-semibold text-[#E45858]">
                                            {unavailablePeople.length}명
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {unavailablePeople.length > 0 ? (
                                            unavailablePeople.map((person, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#E45858] flex-shrink-0" />
                                                    <span className="text-[13px] font-medium text-[#0B1114] truncate">
                                                        {person.name}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[12px] text-gray-400 font-medium mt-2">
                                                모든 멤버가 가능합니다! 🎉
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ========================================================================= */
                    /* Tab 2. 조율 현황 (모든 세션 참여자 교집합 캘린더 & 최종 일정 확정) */
                    /* ========================================================================= */
                    <div className="flex flex-col gap-5">

                        {/* 1. 만날 날짜 섹션 헤더 (과거 일자는 제외하고 오늘 및 미래 일자만 카운트) */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-semibold text-[#0B1114]">
                                    만날 날짜
                                </h3>
                                <span className="text-[12px] font-medium text-[#0098CC]">
                                    {Array.from(allMatchingDatesSet).filter(d => d >= formatDateToYMD(new Date())).length}일 가능 (전원 참석)
                                </span>
                            </div>

                            {/* 2. 월 네비게이션 */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[18px] font-bold text-[#0B1114]">
                                    {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handlePrevMonth}
                                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                    <button
                                        onClick={handleNextMonth}
                                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* 3. 캘린더 카드 (모든 세션 참여자가 동시에 가능한 날짜만 하이라이트) */}
                            <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-4 shadow-xs">
                                <div className="grid grid-cols-7 gap-y-3 text-center">
                                    {['일', '월', '화', '수', '목', '금', '토'].map((name, idx) => (
                                        <div
                                            key={idx}
                                            className={`text-[13px] font-medium pb-2 ${
                                                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-[#737373]'
                                            }`}
                                        >
                                            {name}
                                        </div>
                                    ))}

                                    {calendarDays.map((item, idx) => {
                                        if (!item) {
                                            return <div key={idx} className="h-9" />;
                                        }

                                        const isSelected = selectedMatchDate === item.dateStr;
                                        const isMatch = item.isMatch;
                                        const isPast = item.isPast;

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    // 과거 일자도 팝업 없이 선택하여 목록 조회 가능
                                                    setSelectedMatchDate(item.dateStr);
                                                    setSelectedConfirmedHours([]); // 날짜 변경 시 시간 초기화
                                                }}
                                                className="h-9 flex items-center justify-center relative cursor-pointer"
                                            >
                                                {isMatch ? (
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] transition-all ${
                                                            isPast
                                                                ? 'bg-gray-200 text-gray-400 font-normal line-through'
                                                                : isSelected
                                                                    ? 'bg-[#00BDF8] text-white font-bold ring-3 ring-[#00BDF8]/30 scale-105 shadow-sm'
                                                                    : 'bg-[#00BDF8] text-white font-bold hover:opacity-90'
                                                        }`}
                                                    >
                                                        {item.day}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] transition-all ${
                                                            isPast
                                                                ? 'text-gray-300 line-through'
                                                                : isSelected
                                                                    ? 'border-2 border-[#00BDF8] text-[#00BDF8] font-bold'
                                                                    : 'text-[#0B1114] hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {item.day}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#737373] mt-0.5 px-1">
                                <span>* 파란색 원: 전원 가능 날짜</span>
                                <span>* 회색/취소선: 지난 일정</span>
                            </div>
                        </div>

                        {/* 4. 선택된 일자의 [모든 세션 참여자가 참석 가능한 시간대] 선택 영역 */}
                        {selectedMatchDate && (
                            <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-4 flex flex-col gap-3 shadow-xs animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h4 className="font-bold text-[15px] text-[#0B1114]">
                                        {formatDisplayDate(selectedMatchDate)} 전원 가능 시간
                                    </h4>
                                    {selectedConfirmedHours.length > 0 && (
                                        <span className="text-[12px] text-[#0098CC] font-semibold">
                                            {selectedConfirmedHours.length}시간 선택됨
                                        </span>
                                    )}
                                </div>

                                {getAllMatchingHoursForDate(selectedMatchDate).length > 0 ? (
                                    <>
                                        {/* 한 라인에 3개씩 배치하는 깔끔하고 부드러운 시간대 버튼 */}
                                        <div className="grid grid-cols-3 gap-2 pt-1">
                                            {getAllMatchingHoursForDate(selectedMatchDate).map(hour => {
                                                const isSelected = selectedConfirmedHours.includes(hour);
                                                const isPastDate = selectedMatchDate < formatDateToYMD(new Date());
                                                const startStr = `${String(hour).padStart(2, '0')}:00`;
                                                const endStr = `${String(hour + 1).padStart(2, '0')}:00`;

                                                return (
                                                    <button
                                                        key={hour}
                                                        disabled={isPastDate}
                                                        onClick={() => {
                                                            if (!isPastDate) {
                                                                handleToggleConfirmedHour(hour);
                                                            }
                                                        }}
                                                        className={`h-[42px] rounded-[10px] text-[12px] flex items-center justify-center transition-all select-none ${
                                                            isPastDate
                                                                ? 'bg-[#F3F4F6] text-gray-400 cursor-default opacity-70'
                                                                : isSelected
                                                                    ? 'bg-[#E1F7FF] text-[#0098CC] font-bold ring-2 ring-[#00BDF8] shadow-xs cursor-pointer'
                                                                    : 'bg-[#F3F4F6] hover:bg-[#EAECEF] text-[#4B5563] font-medium cursor-pointer'
                                                        }`}
                                                    >
                                                        {startStr} ~ {endStr}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* 2줄 안내 문구 */}
                                        <div className="text-[11px] text-[#737373] mt-1 space-y-0.5 leading-relaxed">
                                            <p>* 합주일정은 반드시 연속된 시간대로 이어서 선택해야 합니다.</p>
                                            <p className="text-[#8E8E93] pl-2">예) 08:00 ~ 09:00, 09:00 ~ 10:00</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-[13px] text-gray-400 py-3 text-center">
                                        해당 날짜에는 모든 세션 멤버가 동시에 겹치는 시간대가 없습니다.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 5. 합주 일정 제목 입력 & 최종 확정 버튼 (현재 및 미래 일자일 때만 노출) */}
                        {selectedMatchDate && selectedMatchDate >= formatDateToYMD(new Date()) && (
                            <div className="flex flex-col gap-2.5 animate-fadeIn">
                                <input
                                    type="text"
                                    value={scheduleTitle}
                                    onChange={(e) => setScheduleTitle(e.target.value)}
                                    placeholder="간단한 일정 및 메모 (예: 1차 정기 합주)"
                                    className="w-full h-[50px] border border-[#E5E5E5] rounded-[12px] px-4 text-[14px] bg-white placeholder:text-gray-400 focus:outline-none focus:border-[#00BDF8] transition-colors"
                                />

                                <button
                                    onClick={handleConfirmScheduleSubmit}
                                    disabled={!bandInfo.canManage && !bandInfo.isLeader}
                                    className={`w-full h-[54px] rounded-[12px] font-bold text-[15px] flex items-center justify-center transition-all shadow-[0_4px_14px_rgba(0,189,248,0.3)] ${
                                        bandInfo.canManage || bandInfo.isLeader
                                            ? 'bg-[#00BDF8] hover:bg-[#00a8dc] text-white active:scale-[0.99] cursor-pointer'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {bandInfo.canManage || bandInfo.isLeader
                                        ? "합주 일정 최종 확정하기"
                                        : "방장 및 클랜 간부만 일정 확정 가능"}
                                </button>
                            </div>
                        )}

                        {/* 6. 최종 확정된 합주 일정 목록 (BN_SCHEDULE) 및 삭제 */}
                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-bold text-[#0B1114]">
                                    최종 확정된 합주 일정
                                </h3>
                                <span className="text-[12px] text-gray-500 font-medium">
                                    총 {confirmedSchedules.length}건
                                </span>
                            </div>

                            {confirmedSchedules.length > 0 ? (
                                <div className="flex flex-col gap-2.5">
                                    {confirmedSchedules.map((item) => (
                                        <div
                                            key={item.schNo}
                                            className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex items-center justify-between shadow-xs"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-[#EBF9FF] text-[#0098CC] text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                        확정
                                                    </span>
                                                    <span className="font-bold text-[14px] text-[#0B1114]">
                                                        {item.title || "합주 일정"}
                                                    </span>
                                                </div>
                                                <span className="text-[13px] font-medium text-[#525252]">
                                                    📅 {formatDisplayDate(item.sttDate)} {formatDisplayTimeRange(item.sttTime, item.endTime)}
                                                </span>
                                            </div>

                                            {/* 삭제 버튼 (방장/간부 권한) */}
                                            {(bandInfo.canManage || bandInfo.isLeader) && (
                                                <button
                                                    onClick={() => handleDeleteConfirmedSchedule(item.schNo, item.title)}
                                                    className="p-2 text-gray-400 hover:text-red-500 active:scale-90 transition-all cursor-pointer"
                                                    title="확정 일정 삭제"
                                                >
                                                    <FaTrashAlt size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-gray-200 rounded-[12px] p-6 text-center text-[13px] text-gray-400">
                                    아직 최종 확정된 합주 일정이 없습니다.
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* 안내 모달 */}
            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default JamScheduleCapture;
