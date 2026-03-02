import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaMusic, FaCheckSquare, FaSquare } from 'react-icons/fa';
import CommonModal from './common/CommonModal';

interface WeightEntry {
    gatherTypeCd: string;
    weightValue: number;
    balanceApplyYn: string;
    name?: string;
}

interface GatheringCreateModalProps {
    clanId: number;
    userId: string;
    onClose: () => void;
    onSubmit: () => void;
}

const GatheringCreateModal: React.FC<GatheringCreateModalProps> = ({ clanId, userId, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');

    const [weights, setWeights] = useState<WeightEntry[]>([]);
    const [availableWeightTypes, setAvailableWeightTypes] = useState<any[]>([]);

    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
    const [currentSessionCd, setCurrentSessionCd] = useState<string>('');

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchWeightTypes = async () => {
            try {
                const response = await fetch('/api/common/codes/BD500');
                if (response.ok) {
                    const data = await response.json();
                    setAvailableWeightTypes(data);
                    // Initialize weights with available types
                    setWeights(data.map((item: any) => ({
                        gatherTypeCd: item.commDtlCd,
                        weightValue: 5,
                        balanceApplyYn: 'Y',
                        name: item.commDtlNm
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch weight types", error);
            }
        };

        const fetchSessionTypes = async () => {
            try {
                const response = await fetch('/api/common/codes/BD100');
                if (response.ok) {
                    const data = await response.json();
                    setAvailableSessions(data);
                }
            } catch (error) {
                console.error("Failed to fetch session types", error);
            }
        };

        fetchWeightTypes();
        fetchSessionTypes();
    }, []);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const handleWeightChange = (index: number, value: number) => {
        const newWeights = [...weights];
        newWeights[index].weightValue = value;
        setWeights(newWeights);
    };

    const handleBalanceToggle = (index: number) => {
        const newWeights = [...weights];
        newWeights[index].balanceApplyYn = newWeights[index].balanceApplyYn === 'Y' ? 'N' : 'Y';
        setWeights(newWeights);
    };

    const handleAddSession = () => {
        if (currentSessionCd) {
            setSelectedSessions(prev => [...prev, currentSessionCd]);
        }
    };

    const handleRemoveSession = (idx: number) => {
        setSelectedSessions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            showAlert('합주 제목을 입력해주세요.');
            return;
        }
        if (selectedSessions.length === 0) {
            showAlert('최소 1개 이상의 모집 세션을 선택해주세요.');
            return;
        }

        const today = new Date();
        const formattedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

        const payload = {
            cnNo: clanId,
            userId: userId,
            title,
            gatherDate: formattedDate,
            roomCnt: 0,
            weights: weights.map(w => ({
                gatherTypeCd: w.gatherTypeCd,
                weightValue: w.weightValue,
                balanceApplyYn: w.balanceApplyYn
            })),
            sessionTypeCds: selectedSessions
        };

        try {
            const response = await fetch('/api/clans/gatherings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onSubmit();
                onClose();
            } else {
                const err = await response.json();
                showAlert(err.message || '등록 실패');
            }
        } catch (error) {
            console.error(error);
            showAlert('오류가 발생했습니다.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-['Pretendard']">
            <div className="bg-white w-full max-w-sm rounded-[20px] shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-500 mr-2 flex items-center text-sm">
                        <FaChevronLeft className="mr-1" />
                        뒤로 가기
                    </button>
                    <h2 className="flex-1 text-center font-bold text-[#003C48]">합주 모집 만들기</h2>
                    <div className="w-16"></div> {/* Spacer */}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-[#003C48] mb-2">공고 제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예) 다음주 토요일 합주 멤버 모집"
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#003C48] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF8A80]/20"
                        />
                    </div>



                    {/* Sessions */}
                    <div>
                        <label className="block text-sm font-bold text-[#003C48] mb-3">모집 세션 선택</label>
                        <div className="flex gap-2 mb-3">
                            <select
                                value={currentSessionCd}
                                onChange={(e) => setCurrentSessionCd(e.target.value)}
                                className="flex-1 bg-gray-100 rounded-xl px-3 py-3 text-[#003C48] text-sm focus:outline-none"
                            >
                                <option value="">세션 선택 (중복 추가 가능)</option>
                                {availableSessions.map(s => (
                                    <option key={s.commDtlCd} value={s.commDtlCd}>{s.commDtlNm}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAddSession}
                                disabled={!currentSessionCd}
                                className="bg-[#003C48] text-white px-5 py-3 rounded-xl text-sm font-bold disabled:bg-gray-300 transition-colors cursor-pointer"
                            >
                                추가
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedSessions.map((cd, idx) => {
                                const sessionNm = availableSessions.find(s => s.commDtlCd === cd)?.commDtlNm || cd;
                                return (
                                    <div key={idx} className="flex items-center bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-sm font-bold border border-blue-200">
                                        <span>{sessionNm}</span>
                                        <button onClick={() => handleRemoveSession(idx)} className="ml-2 text-blue-400 hover:text-red-500 transition-colors cursor-pointer">
                                            <FaTimes size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Matching Options (Toggles) */}
                    <div>
                        <label className="block text-sm font-bold text-[#003C48] mb-3">매칭 옵션 설정</label>
                        <div className="space-y-2">
                            {weights.map((w, idx) => {
                                const isSkill = w.gatherTypeCd === 'SKILL' || w.name?.includes('기술');
                                const isGender = w.gatherTypeCd === 'GENDER' || w.name?.includes('성별');
                                const isMbti = w.gatherTypeCd === 'MBTI' || w.name?.includes('MBTI');

                                let label = w.name || w.gatherTypeCd;
                                let onText = "ON";
                                let offText = "OFF";

                                if (isSkill) {
                                    label = "세션 기술능력";
                                    onText = "세션평균(Lv 평균)";
                                    offText = "세션기준(Lv2 or Lv4)";
                                } else if (isGender) {
                                    label = "멤버균등배분";
                                } else if (isMbti) {
                                    label = "MBTI균등배분";
                                }

                                const isActive = w.balanceApplyYn === 'Y';

                                return (
                                    <div key={w.gatherTypeCd} className="bg-white rounded-[15px] py-2 px-4 border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[#003C48] text-[14px] font-bold">{label}</span>
                                            <span className={`text-[11px] font-medium mt-0.5 ${isActive ? 'text-[#FF8A80]' : 'text-gray-400'}`}>
                                                {isActive ? onText : offText}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleBalanceToggle(idx)}
                                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? 'bg-[#FF8A80]' : 'bg-gray-200'
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${isActive ? 'translate-x-7' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 mt-auto">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#FF8A80] text-white py-2.5 rounded-[15px] text-[14px] font-bold shadow-md hover:bg-[#FF7060] transition-transform active:scale-[0.98]"
                    >
                        모집 공고 올리기
                    </button>
                </div>

                {/* Alert Modal */}
                <CommonModal
                    isOpen={isAlertOpen}
                    type="alert"
                    message={alertMessage}
                    onConfirm={() => setIsAlertOpen(false)}
                />

            </div>
        </div>
    );
};

export default GatheringCreateModal;
