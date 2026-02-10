import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaMinusCircle } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface Schedule {
    cnSchNo: number;
    title: string;
    sttDate: string; // YYYYMMDD
    sttTiem: string;
    cnNo?: number;
    // ... other fields
}

const ClanCalendar: React.FC = () => {
    const { clanId } = useParams<{ clanId: string }>();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [newScheduleTitle, setNewScheduleTitle] = useState("");
    const [userRole, setUserRole] = useState<string>("NONE"); // 01: Leader, 02: Executive, 03: Member, etc.

    // Modal State
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch User Role
    useEffect(() => {
        const fetchRole = async () => {
            if (!clanId) return;
            const userId = localStorage.getItem('userId');
            if (!userId) return;
            try {
                const res = await fetch(`/api/clans/${clanId}/members/${userId}/role`);
                if (res.ok) {
                    const role = await res.text();
                    setUserRole(role);
                }
            } catch (error) {
                console.error("Failed to fetch user role", error);
            }
        };
        fetchRole();
    }, [clanId]);

    // Fetch schedules for the current month
    const fetchSchedules = async () => {
        if (!clanId) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        try {
            const res = await fetch(`/api/clan/schedule?clanId=${clanId}&year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [clanId, currentDate.getMonth()]); // Fetch on month change

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            const hasSchedule = schedules.some(s => s.sttDate === dateStr);

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDate(new Date(year, month, d))}
                    className={`h-10 flex flex-col items-center justify-center cursor-pointer rounded-full relative
                        ${isSelected ? 'bg-[#00BDF8] text-white' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                >
                    <span className="text-sm font-medium">{d}</span>
                    {hasSchedule && !isSelected && (
                        <div className="w-1.5 h-1.5 bg-[#FF8A80] rounded-full mt-0.5"></div>
                    )}
                </div>
            );
        }
        return days;
    };

    const handleAddSchedule = async () => {
        if (!newScheduleTitle.trim() || !clanId) return;
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch('/api/clan/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnNo: Number(clanId),
                    title: newScheduleTitle,
                    sttDate: dateStr,
                    insId: userId
                })
            });

            if (res.ok) {
                setNewScheduleTitle("");
                fetchSchedules(); // Refresh to show dot
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteClick = (scheduleId: number) => {
        setDeleteTargetId(scheduleId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTargetId === null) return;
        try {
            const res = await fetch(`/api/clan/schedule/${deleteTargetId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchSchedules();
            }
        } catch (error) {
            console.error("Failed to delete schedule", error);
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const selectedDateStr = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}`;
    const selectedSchedules = schedules.filter(s => s.sttDate === selectedDateStr);

    const canManage = userRole === '01' || userRole === '02';

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                        <FaChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl text-[#003C48] font-bold">클랜 캘린더</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-20"> {/* pb-20 for fixed bottom input */}
                {/* Calendar Card */}
                <div className="bg-[#f2f4f5] rounded-3xl p-6 mb-6">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[#003C48] font-bold text-lg">
                            {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-4">
                            <button onClick={handlePrevMonth}><FaChevronLeft className="text-[#003C48]" /></button>
                            <button onClick={handleNextMonth}><FaChevronRight className="text-[#003C48]" /></button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center text-gray-500 text-sm font-medium">
                        <div>S</div>
                        <div>M</div>
                        <div>T</div>
                        <div>W</div>
                        <div>T</div>
                        <div>F</div>
                        <div>S</div>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-y-2">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Schedule List */}
                <div className="space-y-4 px-2">
                    {selectedSchedules.length > 0 ? (
                        selectedSchedules.map(sch => (
                            <div key={sch.cnSchNo} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-[#003C48] rounded-full"></div>
                                <span className="text-[#003C48] font-bold text-sm">{sch.title}</span>
                                {canManage && (
                                    <span
                                        onClick={() => handleDeleteClick(sch.cnSchNo)}
                                        className="ml-auto text-gray-400 cursor-pointer hover:text-red-500"
                                    >
                                        <FaMinusCircle className="text-[#FF8A80]" />
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400 text-center text-sm py-4">등록된 일정이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Bottom Input - Only for Managers */}
            {canManage && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 fixed bottom-[60px] left-0 right-0 z-50">
                    <input
                        type="text"
                        value={newScheduleTitle}
                        onChange={(e) => setNewScheduleTitle(e.target.value)}
                        placeholder="추가할 일정을 입력하세요."
                        className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#00BDF8]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSchedule(); // Optional: Allow Enter to add
                        }}
                    />
                    <button
                        onClick={handleAddSchedule}
                        className="bg-[#00BDF8] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap"
                    >
                        추가
                    </button>
                </div>
            )}

            <CommonModal
                isOpen={isDeleteModalOpen}
                type="confirm"
                message="일정을 삭제하시겠습니까?"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default ClanCalendar;
