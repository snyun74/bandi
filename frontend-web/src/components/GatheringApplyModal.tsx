import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaMusic, FaCheckCircle } from 'react-icons/fa';
import CommonModal from './common/CommonModal';

interface GatheringApplyModalProps {
    gathering: any;
    userId: string;
    onClose: () => void;
    onSubmit: () => void;
}

const GatheringApplyModal: React.FC<GatheringApplyModalProps> = ({ gathering, userId, onClose, onSubmit }) => {
    const [session1st, setSession1st] = useState('');
    const [session2nd, setSession2nd] = useState('');

    const [sessionTypes, setSessionTypes] = useState<any[]>([]);
    const [userSkills, setUserSkills] = useState<any[]>([]);

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Session Types
                const sessionsRes = await fetch('/api/common/codes/BD100');
                if (sessionsRes.ok) {
                    const data = await sessionsRes.json();
                    setSessionTypes(data);
                }

                // 2. Fetch User Profile to pre-fill session
                const profileRes = await fetch(`/api/profile?userId=${userId}`);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    if (data.skills && data.skills.length > 0) {
                        const topSkill = data.skills.sort((a: any, b: any) => b.score - a.score)[0];
                        setSession1st(topSkill.sessionTypeCd);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch application data", error);
            }
        };
        fetchData();
    }, [userId]);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const handleSubmit = async () => {
        if (!session1st) {
            showAlert('1지망 세션을 선택해주세요.');
            return;
        }

        const payload = {
            gatherNo: gathering.gatherNo,
            userId,
            sessionTypeCd1st: session1st,
            sessionTypeCd2nd: session2nd || null
        };

        try {
            const response = await fetch('/api/clans/gatherings/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onSubmit();
                onClose();
            } else {
                const err = await response.json();
                showAlert(err.message || '신청 실패');
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
                    <h2 className="flex-1 text-center font-bold text-[#003C48]">합주 참여 신청</h2>
                    <div className="w-16"></div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    {/* Info */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h3 className="text-[#FF8A80] font-bold text-lg mb-1">{gathering?.title}</h3>
                        <p className="text-gray-500 text-sm">합주일: {gathering?.gatherDate && `${gathering.gatherDate.substring(0, 4)}.${gathering.gatherDate.substring(4, 6)}.${gathering.gatherDate.substring(6, 8)}`}</p>
                    </div>

                    {/* 1st Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-[#003C48]">1지망 세션</label>
                        <select
                            value={session1st}
                            onChange={(e) => setSession1st(e.target.value)}
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#003C48] focus:outline-none"
                        >
                            <option value="">세션 선택</option>
                            {sessionTypes
                                .filter(st => !gathering.sessionTypeCds || gathering.sessionTypeCds.includes(st.commDtlCd))
                                .map(st => (
                                    <option key={st.commDtlCd} value={st.commDtlCd}>{st.commDtlNm}</option>
                                ))}
                        </select>
                    </div>

                    {/* 2nd Selection */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-[#003C48]">2지망 세션 (선택)</label>
                        <select
                            value={session2nd}
                            onChange={(e) => setSession2nd(e.target.value)}
                            className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[#003C48] focus:outline-none"
                        >
                            <option value="">세션 선택 (없음)</option>
                            {sessionTypes
                                .filter(st => st.commDtlCd !== session1st && (!gathering.sessionTypeCds || gathering.sessionTypeCds.includes(st.commDtlCd)))
                                .map(st => (
                                    <option key={st.commDtlCd} value={st.commDtlCd}>{st.commDtlNm}</option>
                                ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 mt-auto">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#FF8A80] text-white py-3.5 rounded-[15px] text-lg font-bold shadow-md hover:bg-[#FF7060] transition-transform active:scale-[0.98]"
                    >
                        참여 신청하기
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

export default GatheringApplyModal;
