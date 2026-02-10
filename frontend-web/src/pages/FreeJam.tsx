import React from 'react';
import { FaLock, FaSearch, FaChevronDown } from 'react-icons/fa';

interface InstrumentStatus {
    role: string;
    status: 'empty' | 'reserved' | 'occupied' | 'my_reservation';
    name?: string;
    level?: string;
    reservationCount?: number;
}

interface RoomData {
    id: number;
    title: string;
    songTitle: string;
    artist: string;
    isLocked?: boolean;
    instruments: InstrumentStatus[];
}

const FreeJam: React.FC = () => {
    // Mock Data to match the image exactly
    const rooms: RoomData[] = [
        {
            id: 1,
            title: "합주할 사람~",
            songTitle: "Love Poem",
            artist: "아이유",
            isLocked: true,
            instruments: [
                { role: "보컬", status: "my_reservation", name: "공석" }, // '취소' implies I reserved it? Or just 'Cancel' action available? Layout shows Name: "공석", Button: "취소"
                { role: "리드기타", status: "reserved", name: "세실리온", level: "Lv.3", reservationCount: 1 },
                { role: "리듬기타", status: "my_reservation", name: "카밀라", level: "Lv.1", reservationCount: 1 }, // '예약 취소'
                { role: "베이스", status: "empty", name: "공석" },
                { role: "키보드", status: "empty", name: "공석" },
                { role: "드럼", status: "empty", name: "공석" },
            ]
        },
        {
            id: 2,
            title: "방 제목", // Using "방 제목" as the label/header as in image 2? Or is it the room title? The image says "방 제목" then "졸업 ...". I'll treat "방 제목" as the label for the section or just the title.
            songTitle: "졸업",
            artist: "브로콜리너마저",
            instruments: [
                { role: "보컬", status: "occupied", name: "23기 허상준" },
                { role: "리드기타", status: "occupied", name: "23기 안용수" },
                { role: "리듬기타", status: "occupied", name: "23기 엄진아" },
                { role: "베이스", status: "occupied", name: "23기 최다연" },
                { role: "키보드", status: "occupied", name: "21기 김민지 (미컴)" },
                { role: "드럼", status: "occupied", name: "23기 이상성" },
            ]
        }
    ];

    const renderInstrumentAction = (inst: InstrumentStatus) => {
        if (inst.status === 'occupied') {
            return <div className="text-[13px] text-gray-800 font-normal">{inst.name}</div>;
        }

        // For Card 1 styled buttons
        if (inst.status === 'my_reservation') {
            // Case 1: Vocal "공석" but with "취소" button (Maybe I'm holding it?)
            // Case 2: Rhythm Guitar "카밀라" with "예약 취소"
            const label = inst.name === '공석' ? '취소' : '예약 취소';
            return (
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm font-bold mt-1">
                    {label}
                </button>
            );
        }

        if (inst.status === 'reserved') {
            return (
                <button className="w-full bg-[#FF9F43] hover:bg-[#ff8f26] text-white py-1.5 rounded-lg text-sm font-bold mt-1">
                    예약
                </button>
            );
        }

        // Empty -> Join
        return (
            <button className="w-full bg-[#00BDF8] hover:bg-[#00a8e0] text-white py-1.5 rounded-lg text-sm font-bold mt-1">
                참여
            </button>
        );
    };

    return (
        <div className="p-4 pb-20" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">자유 합주방</h2>
                <button className="bg-[#00BDF8] text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                    방 생성
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00BDF8]">
                        <FaSearch />
                    </div>
                    <input
                        type="text"
                        placeholder="방 제목, 곡명, 아티스트명으로 검색"
                        className="w-full pl-10 pr-4 py-2.5 border border-[#00BDF8] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#00BDF8]"
                    />
                </div>
                <div className="relative">
                    <button className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2.5 rounded-lg text-sm text-gray-700 font-medium">
                        최신순 <FaChevronDown className="text-xs" />
                    </button>
                </div>
            </div>

            {/* Room List */}
            <div className="space-y-6">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        {/* Room Header */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                {room.isLocked && <FaLock className="text-gray-700 text-sm" />}
                                <h3 className="text-base font-bold text-gray-900">{room.title}</h3>
                            </div>
                            <div className="text-[#00BDF8] font-bold text-[15px]">
                                {room.artist} - {room.songTitle}
                            </div>
                        </div>

                        <hr className="border-gray-100 my-4" />

                        {/* Instruments Grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            {room.instruments.map((inst, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="font-bold text-gray-900 text-[13px]">{inst.role}</span>
                                    </div>

                                    {/* Name / Info area */}
                                    <div className="min-h-[20px] mb-1">
                                        {inst.status === 'empty' && inst.name === '공석' ? (
                                            <span className="text-gray-400 text-[13px]">공석</span>
                                        ) : inst.status === 'occupied' ? (
                                            // Render logic handled in action/display below? No, name is displayed separately in image usually?
                                            // In image 2: "23기 허상준" is the content.
                                            // In image 1: "카밀라 Lv.1 (예약 1명)" is the content.
                                            null
                                        ) : (
                                            <div className="text-[12px] text-gray-800">
                                                <span>{inst.name}</span>
                                                {inst.level && <span className="text-gray-500 text-[11px] ml-1">{inst.level}</span>}
                                                {inst.reservationCount && <span className="text-[#FF9F43] text-[11px] ml-1">(예약 {inst.reservationCount}명)</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {renderInstrumentAction(inst)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FreeJam;
