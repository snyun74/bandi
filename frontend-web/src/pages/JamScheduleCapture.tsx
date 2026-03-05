import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMicrophone, FaGuitar, FaDrum, FaPen, FaUnlink } from 'react-icons/fa';
import { GiGrandPiano } from "react-icons/gi";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import CommonModal from '../components/common/CommonModal';
import './JamScheduleCapture.css';

interface ScheduleDto {
    bnSchNo: number;
    bnNo: number;
    title: string;
    startDate: string; // YYYYMMDD
    startTime: string; // HHMM
    endDate: string;
    endTime: string;
    userId: string;
}

const JamScheduleCapture: React.FC = () => {
    const navigate = useNavigate();
    const { jamId } = useParams<{ jamId: string }>();
    const userId = localStorage.getItem('userId');
    const [date, setDate] = useState<Date>(new Date());

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

    const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);

    const [bandInfo, setBandInfo] = useState<{
        title: string;
        artist: string;
        imgUrl: string;
        roles: any[]; // Add roles to state
    }>({
        title: "",
        artist: "",
        imgUrl: "",
        roles: []
    });

    useEffect(() => {
        fetchBandInfo();
        fetchSchedules();
    }, [jamId, date]);

    const fetchBandInfo = async () => {
        if (!jamId || !userId) return;
        try {
            const response = await fetch(`/api/bands/${jamId}?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setBandInfo({
                    title: data.title || "합주실",
                    artist: data.artist || "아티스트",
                    imgUrl: data.imgUrl,
                    roles: data.roles || [] // Store roles
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
                const data = await response.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        }
    };

    const isDragging = React.useRef(false);
    const lastToggledHour = React.useRef<number | null>(null);
    const initialSelectionState = React.useRef<boolean>(true); // true = selecting, false = deselecting
    const justTouched = React.useRef(false); // 터치 후 합성 mousedown 이중 발생 방지

    useEffect(() => {
        // Global mouse up handler to end dragging safely
        const handleGlobalMouseUp = () => {
            isDragging.current = false;
            lastToggledHour.current = null;
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const handleDateChange = (newDate: any) => {
        setDate(newDate);
        setSelectedTimeSlots([]); // Clear selection on date change
    };

    const toggleTimeSlot = (hour: number, forceState?: boolean) => {
        setSelectedTimeSlots(prev => {
            const isSelected = prev.includes(hour);
            let shouldSelect = !isSelected;

            if (forceState !== undefined) {
                shouldSelect = forceState;
            }

            if (shouldSelect && !isSelected) {
                return [...prev, hour];
            } else if (!shouldSelect && isSelected) {
                return prev.filter(h => h !== hour);
            }
            return prev;
        });
    };

    // --- Mouse Handlers (Desktop) ---
    const onMouseDown = (hour: number, e: React.MouseEvent) => {
        // 터치 이벤트 직후 합성 mousedown이 중복 발생하는 경우 무시
        if (justTouched.current) return;

        isDragging.current = true;
        lastToggledHour.current = hour;

        // Determine initial action based on the first clicked slot
        const isCurrentlySelected = selectedTimeSlots.includes(hour);
        initialSelectionState.current = !isCurrentlySelected;

        toggleTimeSlot(hour, initialSelectionState.current);
    };

    const onMouseEnter = (hour: number) => {
        if (!isDragging.current) return;
        if (lastToggledHour.current === hour) return;

        lastToggledHour.current = hour;
        toggleTimeSlot(hour, initialSelectionState.current);
    };

    // --- Touch Handlers (Mobile) ---
    const onTouchStart = (hour: number, e: React.TouchEvent) => {
        // 터치 후 500ms 동안 합성 mousedown 무시하도록 플래그 설정
        justTouched.current = true;
        setTimeout(() => { justTouched.current = false; }, 500);

        isDragging.current = true;
        lastToggledHour.current = hour;

        const isCurrentlySelected = selectedTimeSlots.includes(hour);
        initialSelectionState.current = !isCurrentlySelected;

        toggleTimeSlot(hour, initialSelectionState.current);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        // Prevent scrolling while dragging slots
        // Note: verify if passive listener issues occur, usually strictly handled in useEffect if needed.
        // But for React synthetic events, we might need CSS touch-action: none on the container.

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target) {
            const slotElement = target.closest('[data-hour]');
            if (slotElement) {
                const hourStr = slotElement.getAttribute('data-hour');
                if (hourStr) {
                    const hour = parseInt(hourStr, 10);
                    if (lastToggledHour.current !== hour) {
                        lastToggledHour.current = hour;
                        toggleTimeSlot(hour, initialSelectionState.current);
                    }
                }
            }
        }
    };

    const onTouchEnd = () => {
        isDragging.current = false;
        lastToggledHour.current = null;
    };

    const getFormattedDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const handleConfirm = async () => {
        if (selectedTimeSlots.length === 0) {
            showAlert("시간을 선택해주세요.");
            return;
        }
        if (!userId || !jamId) {
            showAlert("사용자 정보 또는 잼 ID가 없습니다.");
            return;
        }

        const targetDate = getFormattedDate(date);

        // Group into contiguous blocks
        const sortedSlots = [...selectedTimeSlots].sort((a, b) => a - b);
        const ranges: { start: number, end: number }[] = [];
        let currentStart = sortedSlots[0];
        let currentEnd = sortedSlots[0];

        for (let i = 1; i < sortedSlots.length; i++) {
            if (sortedSlots[i] === currentEnd + 1) {
                currentEnd = sortedSlots[i];
            } else {
                ranges.push({ start: currentStart, end: currentEnd });
                currentStart = sortedSlots[i];
                currentEnd = sortedSlots[i];
            }
        }
        ranges.push({ start: currentStart, end: currentEnd });

        // Save each range
        try {
            for (const range of ranges) {
                // User requested format: HH + "0000" for start, HH + "5900" for end
                // Also "P" for coordination, FIXED title/content

                const startStr = String(range.start).padStart(2, '0') + "0000";
                const endStr = String(range.end).padStart(2, '0') + "5900";

                await fetch('/api/bands/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bnNo: jamId,
                        title: "합주조율",
                        content: "합주내용",
                        startDate: targetDate,
                        startTime: startStr,
                        endDate: targetDate,
                        endTime: endStr,
                        allDayYn: 'P',
                        userId: userId
                    })
                });
            }
            showAlert("일정이 확정되었습니다.");
            setSelectedTimeSlots([]);
            fetchSchedules(); // Refresh schedules after successful save
        } catch (error) {
            console.error("Failed to save schedule", error);
            showAlert("저장에 실패했습니다.");
        }
    };

    const getIconComponent = (type: string, idx: number) => {
        const className = "text-white text-[8px]";
        switch (type) {
            case 'vocal': return <FaMicrophone key={idx} className={className} />;
            case 'guitar': return <FaGuitar key={idx} className={className} />;
            case 'bass': return <FaGuitar key={idx} className={className} />; // 베이스 (기타 아이콘 대체)
            case 'drum': return <FaDrum key={idx} className={className} />;
            case 'keyboard': return <GiGrandPiano key={idx} className={className} />;
            default: return <FaMicrophone key={idx} className={className} />;
        }
    };

    const getUserIconType = (member: any) => {
        const typeCd = (member.sessionTypeCd || '').toLowerCase();
        const partName = (member.part || '').toLowerCase();

        if (partName.includes('보컬') || partName.includes('vocal') || typeCd.includes('bd1001')) return 'vocal';
        if (partName.includes('기타') || partName.includes('guitar') || typeCd.includes('bd1002')) return 'guitar';
        if (partName.includes('베이스') || partName.includes('bass') || typeCd.includes('bd1003')) return 'bass';
        if (partName.includes('드럼') || partName.includes('drum') || typeCd.includes('bd1004')) return 'drum';
        if (partName.includes('키보드') || partName.includes('건반') || partName.includes('keyboard') || typeCd.includes('bd1005')) return 'keyboard';

        // 매칭 실패 시 partName으로 디버그 가능하도록 콘솔 출력
        console.log('[getUserIconType] 매칭 실패 - typeCd:', member.sessionTypeCd, 'part:', member.part);
        return 'vocal'; // fallback
    };

    // Check if a slot is occupied by existing schedules
    const getSlotStatus = (hour: number) => {
        const targetDate = getFormattedDate(date);

        // 1. Get schedules for this hour
        const relevantSchedules = schedules.filter(s => {
            if (s.startDate !== targetDate) return false;

            const startH = parseInt(s.startTime.substring(0, 2));
            let endH = parseInt(s.endTime.substring(0, 2));
            const endM = parseInt(s.endTime.substring(2, 4));
            if (endM >= 50) endH += 1;

            return hour >= startH && hour < endH;
        });

        // 2. Identify Participants
        const participantIds = Array.from(new Set(relevantSchedules.map(s => s.userId).filter(Boolean)));

        // 3. Map to Icons
        const icons = participantIds.map(uid => {
            const member = bandInfo.roles.find(r => r.userId === uid);
            if (member) return getUserIconType(member);
            return 'vocal'; // Fallback
        });

        // 4. Determine Color
        const totalMembers = bandInfo.roles.length;
        const isFull = totalMembers > 0 && participantIds.length >= totalMembers;

        let color = 'bg-gray-100';

        if (selectedTimeSlots.includes(hour)) {
            color = 'bg-[#FF6B6B]'; // 내가 선택한 시간대 (빨간 계열)
        } else if (participantIds.length > 0) {
            if (isFull) {
                color = 'bg-[#2EE59D]'; // 전원 참여 (초록)
            } else {
                // 일부 참여: 비율에 따라 파란 계열 농도 조절
                if (participantIds.length / totalMembers > 0.5) {
                    color = 'bg-[#00BDF8]'; // 과반수 이상 - 진한 파랑
                } else {
                    color = 'bg-[#7DDCF8]'; // 과반수 미만 - 연한 파랑
                }
            }
        }

        return { color, icons };
    };

    const handleCancel = async () => {
        if (!userId || !jamId) return;

        try {
            const targetDate = getFormattedDate(date);
            await fetch(`/api/bands/schedule?bnNo=${jamId}&userId=${userId}&date=${targetDate}`, {
                method: 'DELETE'
            });
            showAlert("일정이 삭제되었습니다.");
            setSelectedTimeSlots([]);
            fetchSchedules();
        } catch (error) {
            console.error("Failed to delete schedule", error);
            showAlert("삭제에 실패했습니다.");
        }
    };

    const renderUnscheduledMembers = () => {
        const targetDate = getFormattedDate(date);

        // 1. Identify members who HAVE scheduled on this date
        const scheduledUserIds = new Set(
            schedules
                .filter(s => s.startDate === targetDate && s.userId)
                .map(s => s.userId)
        );

        // 2. Identify all members from bandInfo.roles
        const unscheduledMembers = (bandInfo.roles || []).filter(r => !scheduledUserIds.has(r.userId));

        // Debugging: Log members to console to check sessionTypeCd/part
        console.log("Unscheduled Members:", unscheduledMembers);

        if (unscheduledMembers.length === 0) return null;

        return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">미참여 멤버</span>
                <div className="flex -space-x-1">
                    {unscheduledMembers.map((member, idx) => {
                        const iconType = getUserIconType(member);

                        return (
                            <div key={idx} className="w-6 h-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-white text-[10px]">
                                {getIconComponent(iconType, idx)}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTimeGrid = () => {
        const morningSlots = Array.from({ length: 12 }, (_, i) => i + 1);
        const afternoonSlots = Array.from({ length: 12 }, (_, i) => i + 13);

        const renderSlot = (hour: number) => {
            const status = getSlotStatus(hour);

            return (
                <div
                    key={hour}
                    className="flex items-center h-8 mb-px"
                >
                    {/* Time Label */}
                    <span className="w-9 text-gray-400 text-[10px] font-bold mr-1 text-right select-none pointer-events-none">
                        {String(hour).padStart(2, '0')}:00
                    </span>

                    {/* Bar Area */}
                    <div className="flex items-center">
                        {/* 히트 영역 래퍼: 행 전체 높이로 확장해 클릭 편의성 향상 */}
                        <div
                            className="flex items-center justify-center h-full w-8 mr-1 cursor-pointer touch-none"
                            data-hour={hour}
                            onMouseDown={(e) => onMouseDown(hour, e)}
                            onMouseEnter={() => onMouseEnter(hour)}
                            onTouchStart={(e) => onTouchStart(hour, e)}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {/* 시각적 박스 (h-6 유지) */}
                            <div className={`w-full h-6 rounded-sm ${status.color} transition-colors duration-200`} />
                        </div>

                        {/* Icons Row - 이벤트 차단 */}
                        <div className="flex items-center gap-0.5 pointer-events-none">
                            {status.icons.map((icon, idx) => (
                                <div key={idx} className="w-4 h-4 bg-[#00BDF8] rounded-full flex items-center justify-center flex-shrink-0">
                                    {getIconComponent(icon, idx)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="grid grid-cols-2 gap-x-1 select-none">
                <div className="flex flex-col">
                    {morningSlots.map(hour => renderSlot(hour))}
                </div>
                <div className="flex flex-col">
                    {afternoonSlots.map(hour => renderSlot(hour))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3 sticky top-0 bg-white z-20">
                <button onClick={() => navigate(-1)} className="text-gray-600">
                    <FaChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                    {bandInfo.imgUrl ? (
                        <img src={bandInfo.imgUrl} alt={bandInfo.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                            <FaUnlink size={14} />
                            <span className="text-[8px] mt-0.5">미연결</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm text-[#003C48] font-bold leading-tight truncate">{bandInfo.title}</h1>
                    <p className="text-xs text-gray-500 truncate">: {bandInfo.artist}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
                {/* Calendar */}
                <div className="mb-4 bg-white">
                    <Calendar
                        onChange={handleDateChange}
                        value={date}
                        className="w-full border-none !font-['Pretendard'] custom-calendar"
                        locale="ko-KR"
                        formatDay={(locale, date) => date.getDate().toString()}
                        onActiveStartDateChange={({ activeStartDate }) => {
                            if (activeStartDate) {
                                handleDateChange(activeStartDate);
                            }
                        }}
                        tileClassName={({ date: tileDate }) => {
                            // Check if date has schedule
                            const dStr = getFormattedDate(tileDate);
                            const hasSchedule = schedules.some(s => s.startDate === dStr);
                            if (hasSchedule) return 'highlight-blue';
                            return '';
                        }}
                    />
                </div>

                {/* Time Grid */}
                {renderTimeGrid()}

                {/* Action Buttons - Moved here */}
                {/* Action Buttons - Moved here */}
                <div className="mt-6 flex items-center justify-between">
                    {/* Unscheduled Members (Left) */}
                    <div className="flex items-center">
                        {renderUnscheduledMembers()}
                    </div>

                    {/* Action Buttons (Right) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="bg-[#EFF1F3] text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="bg-[#FFEBEB] text-[#FF5252] text-xs font-bold px-4 py-2 rounded-full shadow-sm hover:bg-[#ffcccc] transition-colors flex items-center gap-1"
                        >
                            <span className="text-sm leading-none">✓</span> 시간 확정
                        </button>
                    </div>
                </div>
            </div>

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
