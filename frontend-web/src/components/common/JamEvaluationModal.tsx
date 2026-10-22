import React, { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import CommonModal from './CommonModal';
import ProfileEditModal from '../profile/ProfileEditModal';

const MemberAvatar: React.FC<{ userId: string }> = ({ userId }) => {
    const [img, setImg] = React.useState<string | null | undefined>(undefined);
    React.useEffect(() => {
        if (!userId) return;
        fetch(`/api/user/profile/${userId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => setImg(d?.profileImageUrl || null))
            .catch(() => setImg(null));
    }, [userId]);
    if (img) {
        return <img src={img} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />;
    }
    return (
        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
            <img src="/images/default_profile.png" alt="" className="w-full h-full object-cover opacity-60" />
        </div>
    );
};

interface EvaluationTarget {
    userId: string;
    userNick: string;
    part: string;
}

interface PendingEvaluation {
    bnNo: number;
    title: string;
    songTitle: string;
    artist: string;
    targets: EvaluationTarget[];
}

interface JamEvaluationModalProps {
    evaluation: PendingEvaluation;
    onComplete: () => void;
}

const JamEvaluationModal: React.FC<JamEvaluationModalProps> = ({ evaluation, onComplete }) => {
    const [scores, setScores] = useState<{ [key: string]: string }>({});
    const [moodMakers, setMoodMakers] = useState<{ [key: string]: boolean }>({});

    // Profile Modal State
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Common Modal State
    const [modalState, setModalState] = useState<{
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

    const openAlert = (message: string, onConfirm?: () => void) => {
        setModalState({
            isOpen: true,
            type: 'alert',
            message,
            onConfirm: () => {
                setModalState(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm();
            },
        });
    };

    const handleScoreChange = (userId: string, value: string) => {
        // Allow only numbers and ensure range 0-100
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
            setScores(prev => ({ ...prev, [userId]: value }));
        }
    };

    const toggleMoodMaker = (userId: string) => {
        setMoodMakers(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const handleSubmit = async () => {
        // Validate that all scores are entered
        const allScored = evaluation.targets.every(t => scores[t.userId] !== undefined && scores[t.userId] !== '');
        if (!allScored) {
            openAlert("모든 멤버의 매너 점수를 입력해주세요.");
            return;
        }

        const results = evaluation.targets.map(t => ({
            targetUserId: t.userId,
            score: parseInt(scores[t.userId] || '0'),
            moodMaker: !!moodMakers[t.userId]
        }));

        // Retrieve userId from local storage - FIXED
        const currentUserId = localStorage.getItem("userId");

        if (!currentUserId) {
            openAlert("로그인 정보가 없습니다.");
            return;
        }

        const payload = {
            bnNo: evaluation.bnNo,
            userId: currentUserId,
            results: results
        };

        try {
            const response = await fetch('/api/bands/evaluation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                openAlert("평가가 완료되었습니다.", () => {
                    onComplete();
                });
            } else {
                const errorText = await response.text();
                openAlert(`평가 제출 실패: ${errorText}`);
            }
        } catch (error) {
            console.error("Evaluation submit error", error);
            openAlert("오류가 발생했습니다.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-80 p-6 shadow-xl relative animate-fadeIn">

                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="text-[14px] font-bold text-gray-800">합주할 사람 ~</h2>
                    <p className="text-[14px] text-gray-600">{evaluation.songTitle} - {evaluation.artist}</p>
                </div>

                {/* Manner Evaluation */}
                <div className="mb-6">
                    <h3 className="text-center text-[14px] font-bold text-slate-700 mb-3">매너 평가</h3>
                    <div className="space-y-3">
                        {evaluation.targets.map(target => (
                            <div key={target.userId} className="flex items-center justify-between">
                                <div 
                                    className="flex items-center w-2/5 cursor-pointer group"
                                    onClick={() => {
                                        setSelectedUserId(target.userId);
                                        setIsProfileModalOpen(true);
                                    }}
                                    title="프로필 보기"
                                >
                                    <div className="mr-1.5 flex-shrink-0 group-hover:ring-2 group-hover:ring-[#00BDF8] group-hover:scale-105 active:scale-95 rounded-full transition-all">
                                        <MemberAvatar userId={target.userId} />
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium group-hover:underline group-hover:text-[#00BDF8] truncate transition-colors">{target.userNick}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="점수 (0~100)"
                                    className="w-3/5 p-2 text-xs bg-gray-100 rounded-lg border-none focus:ring-1 focus:ring-blue-300 outline-none"
                                    value={scores[target.userId] || ''}
                                    onChange={(e) => handleScoreChange(target.userId, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mood Maker */}
                <div className="mb-6">
                    <h3 className="text-center text-[14px] font-bold text-slate-700 mb-3">분위기 메이커</h3>
                    <div className="space-y-2">
                        {evaluation.targets.map(target => (
                            <div key={target.userId} className="flex items-center justify-between py-1">
                                <div 
                                    className="flex items-center cursor-pointer select-none" 
                                    onClick={() => toggleMoodMaker(target.userId)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 transition-colors ${moodMakers[target.userId] ? 'bg-[#00BDF8] border-[#00BDF8]' : 'border-gray-400 bg-white'}`}>
                                        {moodMakers[target.userId] && <FaCheck className="text-white text-xs" />}
                                    </div>
                                    <span className="text-xs text-gray-700 font-medium">{target.userNick}</span>
                                </div>
                                <div 
                                    className="flex items-center cursor-pointer group p-1"
                                    onClick={() => {
                                        setSelectedUserId(target.userId);
                                        setIsProfileModalOpen(true);
                                    }}
                                    title="프로필 보기"
                                >
                                    <div className="group-hover:ring-2 group-hover:ring-[#00BDF8] group-hover:scale-105 active:scale-95 rounded-full transition-all">
                                        <MemberAvatar userId={target.userId} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        onClick={handleSubmit}
                        className="bg-cyan-400 text-white rounded-full px-8 py-2 font-bold text-[14px] hover:bg-cyan-500 transition-colors shadow-md"
                    >
                        완료
                    </button>
                </div>

            </div>
            {/* Common Modal */}
            <CommonModal
                isOpen={modalState.isOpen}
                type={modalState.type}
                message={modalState.message}
                onConfirm={modalState.onConfirm}
                onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
            />

            {/* User Profile Modal */}
            {selectedUserId && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                        setIsProfileModalOpen(false);
                        setSelectedUserId(null);
                    }}
                    userId={selectedUserId}
                    onProfileUpdate={() => {}}
                    isReadOnly={selectedUserId !== localStorage.getItem('userId')}
                />
            )}
        </div>
    );
};

export default JamEvaluationModal;
