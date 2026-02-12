import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaCheckSquare, FaRegSquare, FaTimes } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface CommDetail {
    commCd: string;
    commDtlCd: string;
    commDtlNm: string;
    commOrder: number;
}

const ClanJamCreate: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();

    // Form inputs
    const [title, setTitle] = useState('');
    const [songTitle, setSongTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [description, setDescription] = useState('');

    // Session Config
    const [availableSessions, setAvailableSessions] = useState<CommDetail[]>([]);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]); // Using commDtlNm for now

    // Custom Session
    const [selectedCustomSession, setSelectedCustomSession] = useState('');
    const [additionalSessions, setAdditionalSessions] = useState<string[]>([]);

    // Private Room
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        // Fetch common code BD100
        const fetchSessions = async () => {
            try {
                const response = await fetch('/api/common/codes/BD100');
                if (response.ok) {
                    const data = await response.json();

                    data.sort((a: CommDetail, b: CommDetail) => {
                        if (a.commOrder !== b.commOrder) {
                            return a.commOrder - b.commOrder;
                        }
                        return a.commDtlCd.localeCompare(b.commDtlCd);
                    });

                    setAvailableSessions(data);
                    // Optionally set default selected sessions if needed, or leave empty
                    // For now, let's select "보컬" if it exists, as per previous mock
                    const vocal = data.find((d: CommDetail) => d.commDtlNm === '보컬');
                    if (vocal) {
                        setSelectedSessions([vocal.commDtlNm]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch session codes", error);
            }
        };

        fetchSessions();
    }, []);

    const toggleSession = (sessionName: string) => {
        if (selectedSessions.includes(sessionName)) {
            setSelectedSessions(selectedSessions.filter(s => s !== sessionName));
        } else {
            setSelectedSessions([...selectedSessions, sessionName]);
        }
    };

    const handleAddCustomSession = () => {
        if (selectedCustomSession) {
            // Allow duplicates in "Additional" list as per typical jam logic (e.g. 2 Guitars)
            setAdditionalSessions([...additionalSessions, selectedCustomSession]);
            setSelectedCustomSession('');
        }
    };

    const removeAdditionalSession = (index: number) => {
        const newSessions = [...additionalSessions];
        newSessions.splice(index, 1);
        setAdditionalSessions(newSessions);
    }

    const showModal = (message: string) => {
        setModalMessage(message);
        setIsModalOpen(true);
    };

    const handleCreateRoom = async () => {
        // Validation
        if (!title.trim()) {
            showModal("방 제목을 입력해주세요.");
            return;
        }
        if (!songTitle.trim()) {
            showModal("곡 제목을 입력해주세요.");
            return;
        }
        if (!artist.trim()) {
            showModal("아티스트를 입력해주세요.");
            return;
        }
        if (!description.trim()) {
            showModal("방 설명을 입력해주세요.");
            return;
        }

        // Check if at least one session is selected (either basic or additional)
        const allSessionNames = [...selectedSessions, ...additionalSessions];
        if (allSessionNames.length === 0) {
            showModal("최소 하나의 세션을 구성해 주세요.");
            return;
        }

        if (isPrivate && !password.trim()) {
            showModal("비밀방 비밀번호를 입력해주세요.");
            return;
        }

        // Map names to codes
        const sessionCodes: string[] = [];
        allSessionNames.forEach(name => {
            const session = availableSessions.find(s => s.commDtlNm === name);
            if (session) {
                sessionCodes.push(session.commDtlCd);
            }
        });

        const userId = localStorage.getItem('userId');
        if (!userId) {
            showModal("로그인이 필요합니다.");
            return;
        }

        const payload = {
            clanId: clanId,
            title,
            songTitle,
            artist,
            description,
            secret: isPrivate,
            password: isPrivate ? password : "",
            userId,
            sessions: sessionCodes
        };

        try {
            const response = await fetch('/api/bands', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                showModal("방이 생성되었습니다.");
                // Note: We need to handle navigation AFTER the modal is closed for success, 
                // but CommonModal onConfirm just closes it. 
                // We can set a flag or just handle it in the onConfirm if we change state.
                // For simplicity, let's just make onConfirm navigate if success message.
            } else {
                showModal("방 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error creating room:", error);
            showModal("오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Jua']" style={{ fontFamily: '"Jua", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 mb-2">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-xl text-[#003C48] font-bold">방 생성</h1>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-6">

                {/* Room Title */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">
                        방제 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8]"
                    />
                </div>

                {/* Song Title */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">
                        곡 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="철자를 틀리지 않게 주의하세요"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        className="w-full bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8] placeholder-gray-400"
                    />
                </div>

                {/* Artist */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">
                        아티스트 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="철자를 틀리지 않게 주의하세요"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className="w-full bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8] placeholder-gray-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">
                        방 세부 설명 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8] min-h-[100px] resize-none"
                    />
                </div>

                {/* Basic Session Config */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">
                        기본 세션 구성 <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-[#F0F4F8] rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4 max-h-40 overflow-y-auto">
                        {availableSessions.map((session) => (
                            <div
                                key={session.commDtlCd}
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => toggleSession(session.commDtlNm)}
                            >
                                {selectedSessions.includes(session.commDtlNm) ? (
                                    <FaCheckSquare className="text-[#003C48]" size={20} />
                                ) : (
                                    <FaRegSquare className="text-gray-400" size={20} />
                                )}
                                <span className="text-[#003C48] text-sm">{session.commDtlNm}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Session Display - NOW ABOVE CUSTOM INPUT */}
                {additionalSessions.length > 0 && (
                    <div>
                        <label className="block text-[#003C48] font-bold mb-2">추가 세션 구성</label>
                        <div className="bg-[#F0F4F8] rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                            {additionalSessions.map((sessionName, index) => (
                                <div key={index} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                                    <span className="text-[#003C48] text-sm font-medium">{sessionName}</span>
                                    <button
                                        onClick={() => removeAdditionalSession(index)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <FaTimes size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Session Input */}
                <div>
                    <label className="block text-[#003C48] font-bold mb-2">커스텀 세션 추가</label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <select
                                value={selectedCustomSession}
                                onChange={(e) => setSelectedCustomSession(e.target.value)}
                                className="w-full bg-[#F0F4F8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00BDF8] appearance-none cursor-pointer pr-8"
                            >
                                <option value="">세션 선택</option>
                                {availableSessions.map((session) => (
                                    <option key={session.commDtlCd} value={session.commDtlNm}>
                                        {session.commDtlNm}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={handleAddCustomSession}
                            className="bg-[#00BDF8] text-white font-bold rounded-xl px-6 py-2 text-sm whitespace-nowrap"
                        >
                            추가
                        </button>
                    </div>
                </div>

                {/* Private Room */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setIsPrivate(!isPrivate)}
                    >
                        {isPrivate ? (
                            <FaCheckSquare className="text-[#003C48]" size={20} />
                        ) : (
                            <FaRegSquare className="text-gray-400" size={20} />
                        )}
                        <span className="text-[#003C48] font-bold">
                            비밀방 {isPrivate && <span className="text-red-500">*</span>}
                        </span>
                    </div>
                </div>
                {isPrivate && (
                    <input
                        type="password"
                        placeholder="비밀번호 입력"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F0F4F8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#00BDF8] mt-2"
                    />
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleCreateRoom}
                        className="bg-[#00BDF8] text-white font-bold text-lg px-12 py-3 rounded-full shadow-md hover:bg-[#00ACD8] transition-colors"
                    >
                        방 생성
                    </button>
                </div>
            </div>

            <CommonModal
                isOpen={isModalOpen}
                type="alert"
                message={modalMessage}
                onConfirm={() => {
                    setIsModalOpen(false);
                    if (modalMessage === "방이 생성되었습니다.") {
                        navigate(-1);
                    }
                }}
            />
        </div>
    );
};

export default ClanJamCreate;
