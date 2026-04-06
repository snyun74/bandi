import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaMicrophone, FaGuitar, FaDrum, FaPen } from 'react-icons/fa';
import DefaultProfile from '../components/common/DefaultProfile';
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

    const showParticipants = (hour: number) => {
        const targetDate = getFormattedDate(date);
        const relevantSchedules = schedules.filter(s => {
            if (s.startDate !== targetDate) return false;
            const startH = parseInt(s.startTime.substring(0, 2));
            let endH = parseInt(s.endTime.substring(0, 2));
            const endM = parseInt(s.endTime.substring(2, 4));
            if (endM >= 50) endH += 1;
            return hour >= startH && hour < endH;
        });

        const participantIds = Array.from(new Set(relevantSchedules.map(s => s.userId).filter(Boolean)));
        
        if (participantIds.length === 0) {
            showAlert(`${String(hour).padStart(2, '0')}:00 시간대에 참여 중인 멤버가 없습니다.`);
            return;
        }

        const details = participantIds.map(uid => {
            const member = bandInfo.roles.find(r => r.userId === uid);
            const name = member?.user || '익명';
            const part = member?.part || '미정';
            return `- [${part}] ${name}`;
        }).join('\n');

        showAlert(`[${String(hour).padStart(2, '0')}:00 참여 인원]\n\n${details}`);
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
        const className = "text-white text-[6px]";
        switch (type) {
            case 'vocal': return <FaMicrophone key={idx} className={className} />;
            case 'guitar': return <FaGuitar key={idx} className={className} />;
            case 'bass': return <FaGuitar key={idx} className={className} />; 
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

        return 'vocal'; // fallback
    };

    const getSlotStatus = (hour: number) => {
        const targetDate = getFormattedDate(date);
        const relevantSchedules = schedules.filter(s => {
            if (s.startDate !== targetDate) return false;
            const startH = parseInt(s.startTime.substring(0, 2));
            let endH = parseInt(s.endTime.substring(0, 2));
            const endM = parseInt(s.endTime.substring(2, 4));
            if (endM >= 50) endH += 1;
            return hour >= startH && hour < endH;
        });

        const participantIds = Array.from(new Set(relevantSchedules.map(s => s.userId).filter(Boolean)));
        const icons = participantIds.map(uid => {
            const member = bandInfo.roles.find(r => r.userId === uid);
            if (member) return getUserIconType(member);
            return 'vocal'; // Fallback
        });

        const totalMembers = bandInfo.roles.length;
        const count = participantIds.length;
        const isAll = totalMembers > 0 && count === totalMembers;

        let color = 'bg-gray-100';
        if (selectedTimeSlots.includes(hour)) {
            color = 'bg-[#FF6B6B]'; 
        } else if (count > 0) {
            if (isAll) {
                color = 'bg-[#2EE59D]'; 
            } else {
                switch (count) {
                    case 1: color = 'bg-[#E1F5FE]'; break;
                    case 2: color = 'bg-[#B3E5FC]'; break;
                    case 3: color = 'bg-[#81D4FA]'; break;
                    case 4: color = 'bg-[#4FC3F7]'; break;
                    case 5: color = 'bg-[#03A9F4]'; break;
                    case 6: default: color = 'bg-[#0288D1]'; break;
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
        const scheduledUserIds = new Set(
            schedules
                .filter(s => s.startDate === targetDate && s.userId)
                .map(s => s.userId)
        );
        const unscheduledMembers = (bandInfo.roles || []).filter(r => !scheduledUserIds.has(r.userId));
        if (unscheduledMembers.length === 0) return null;

        return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">미참여 멤버</span>
                <div className="flex -space-x-1">
                    {unscheduledMembers.map((member, idx) => {
                        const iconType = getUserIconType(member);
                        return (
                            <div key={idx} className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-white text-[8px]">
                                {getIconComponent(iconType, idx)}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTimeGrid = () => {
        const q1Slots = Array.from({ length: 6 }, (_, i) => i + 1);
        const q2Slots = Array.from({ length: 6 }, (_, i) => i + 7);
        const q3Slots = Array.from({ length: 6 }, (_, i) => i + 13);
        const q4Slots = Array.from({ length: 6 }, (_, i) => i + 19);

        const renderSlot = (hour: number) => {
            const status = getSlotStatus(hour);
            return (
                <div key={hour} className="flex items-center w-full h-6 mb-[2px]">
                    <span
                        onClick={() => showParticipants(hour)}
                        className="w-8 text-gray-400 text-xs font-bold mr-1 text-right select-none cursor-pointer hover:text-[#00BDF8] active:scale-95 transition-all flex-shrink-0"
                    >
                        {String(hour).padStart(2, '0')}:00
                    </span>
                    <div
                        className="flex-1 flex items-center justify-center h-full cursor-pointer touch-none"
                        data-hour={hour}
                        onMouseDown={(e) => onMouseDown(hour, e)}
                        onMouseEnter={() => onMouseEnter(hour)}
                        onTouchStart={(e) => onTouchStart(hour, e)}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className={`w-full h-full rounded-sm ${status.color} transition-colors duration-200`} />
                    </div>
                </div>
            );
        };

        return (
            <div className="grid grid-cols-4 gap-x-5 select-none w-full">
                <div className="flex flex-col">
                    {q1Slots.map(hour => renderSlot(hour))}
                </div>
                <div className="flex flex-col">
                    {q2Slots.map(hour => renderSlot(hour))}
                </div>
                <div className="flex flex-col">
                    {q3Slots.map(hour => renderSlot(hour))}
                </div>
                <div className="flex flex-col">
                    {q4Slots.map(hour => renderSlot(hour))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3 sticky top-0 bg-white z-20 flex-shrink-0 border-b border-gray-50">
                <button onClick={() => navigate(-1)} className="text-gray-600">
                    <FaChevronLeft size={22} />
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                    {bandInfo.imgUrl ? (
                        <img src={bandInfo.imgUrl} alt={bandInfo.title} className="w-full h-full object-cover" />
                    ) : (
                        <DefaultProfile type="jam" iconSize={16} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm text-[#003C48] font-bold leading-tight truncate">{bandInfo.title}</h1>
                    <p className="text-xs text-gray-500 truncate">: {bandInfo.artist}</p>
                </div>
            </div>

            {/* Content Container - Sequential flow for single screen fitness */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto no-scrollbar">
                {/* 1. Calendar Area */}
                <div className="mb-4 bg-white flex-shrink-0">
                    <Calendar
                        onChange={handleDateChange}
                        className="custom-calendar"
                        value={date}
                        formatDay={(_, date) => String(date.getDate())}
                        calendarType="gregory"
                        prev2Label={null}
                        next2Label={null}
                        tileClassName={({ date: tileDate }) => {
                            const dStr = getFormattedDate(tileDate);
                            const daySchedules = schedules.filter(s => s.startDate === dStr);
                            const participantIds = Array.from(new Set(daySchedules.map(s => s.userId).filter(Boolean)));
                            const totalMembers = bandInfo.roles.length;

                            if (participantIds.length === 0) return '';
                            if (totalMembers > 0 && participantIds.length === totalMembers) {
                                return 'highlight-green';
                            }
                            return 'highlight-blue';
                        }}
                    />
                </div>

                {/* 2. Time Grid Area */}
                <div className="mb-6 flex-shrink-0">
                    {renderTimeGrid()}
                </div>

                {/* 3. Action Area - Follows Grid naturally */}
                <div className="pt-4 border-t border-gray-100 flex-shrink-0 pb-2">
                    <div className="flex items-center justify-between">
                        {/* Unscheduled Members (Left) */}
                        <div className="flex items-center">
                            {renderUnscheduledMembers()}
                        </div>

                        {/* Action Buttons (Right) */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleCancel}
                                className="bg-[#EFF1F3] text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="bg-[#FFEBEB] text-[#FF5252] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-[#ffcccc] transition-colors flex items-center gap-1"
                            >
                                <span className="text-xs leading-none">✓</span> 시간 확정
                            </button>
                        </div>
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
