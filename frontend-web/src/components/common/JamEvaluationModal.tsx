import React, { useState } from 'react';
import { FaUserCircle, FaCheck } from 'react-icons/fa';
import CommonModal from './CommonModal';

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
                    <h2 className="text-lg font-bold text-gray-800">합주할 사람 ~</h2>
                    <p className="text-sm text-gray-600">{evaluation.songTitle} - {evaluation.artist}</p>
                </div>

                {/* Manner Evaluation */}
                <div className="mb-6">
                    <h3 className="text-center text-md font-bold text-slate-700 mb-3">매너 평가</h3>
                    <div className="space-y-3">
                        {evaluation.targets.map(target => (
                            <div key={target.userId} className="flex items-center justify-between">
                                <div className="flex items-center w-1/4">
                                    <FaUserCircle className="text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-700 truncate">{target.userNick}</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="매너 점수를 입력하세요 (0~100)"
                                    className="w-3/4 p-2 text-xs bg-gray-100 rounded-lg border-none focus:ring-1 focus:ring-blue-300 outline-none"
                                    value={scores[target.userId] || ''}
                                    onChange={(e) => handleScoreChange(target.userId, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mood Maker */}
                <div className="mb-6">
                    <h3 className="text-center text-md font-bold text-slate-700 mb-3">분위기 메이커</h3>
                    <div className="space-y-2">
                        {evaluation.targets.map(target => (
                            <div key={target.userId} className="flex items-center cursor-pointer" onClick={() => toggleMoodMaker(target.userId)}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 ${moodMakers[target.userId] ? 'bg-cyan-400 border-cyan-400' : 'border-gray-400'}`}>
                                    {moodMakers[target.userId] && <FaCheck className="text-white text-xs" />}
                                </div>
                                <div className="flex items-center">
                                    <FaUserCircle className="text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-700">{target.userNick}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        onClick={handleSubmit}
                        className="bg-cyan-400 text-white rounded-full px-8 py-2 font-bold hover:bg-cyan-500 transition-colors shadow-md"
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
        </div>
    );
};

export default JamEvaluationModal;
