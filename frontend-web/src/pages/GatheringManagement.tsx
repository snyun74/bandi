import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaChevronLeft, FaUsers, FaCheckCircle, FaPlay, FaRedo, FaListUl, FaFlagCheckered } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

const GatheringManagement: React.FC = () => {
    const navigate = useNavigate();
    const { clanId } = useParams<{ clanId: string }>();
    const [gatherings, setGatherings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGather, setSelectedGather] = useState<any>(null);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isApplicantsOpen, setIsApplicantsOpen] = useState(false);

    // Alert State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (clanId) {
            fetchAllGatherings();
        }
    }, [clanId]);

    const fetchAllGatherings = async () => {
        try {
            const res = await fetch(`/api/clans/gatherings/clan/${clanId}/all?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setGatherings(data.sort((a: any, b: any) => b.gatherNo - a.gatherNo));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertOpen(true);
    };

    const handleCloseRecruitmentClick = (gatherNo: number) => {
        setConfirmMessage('모집을 종료하시겠습니까?');
        setOnConfirmAction(() => () => executeCloseRecruitment(gatherNo));
        setIsConfirmOpen(true);
    };

    const executeCloseRecruitment = async (gatherNo: number) => {
        setIsConfirmOpen(false);
        try {
            const res = await fetch(`/api/clans/gatherings/${gatherNo}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                showAlert('모집이 종료되었습니다.');
                fetchAllGatherings();
            }
        } catch (error) {
            showAlert('종료 처리 실패');
        }
    };

    const handleReopenRecruitmentClick = (gatherNo: number) => {
        setConfirmMessage('모집을 다시 시작하시겠습니까?');
        setOnConfirmAction(() => () => executeReopenRecruitment(gatherNo));
        setIsConfirmOpen(true);
    };

    const executeReopenRecruitment = async (gatherNo: number) => {
        setIsConfirmOpen(false);
        try {
            const res = await fetch(`/api/clans/gatherings/${gatherNo}/reopen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                showAlert('모집이 재개되었습니다.');
                fetchAllGatherings();
            } else {
                const err = await res.json();
                showAlert(err.message || '재개 실패');
            }
        } catch (error) {
            showAlert('오류 발생');
        }
    };

    const handleShowApplicants = async (gather: any) => {
        try {
            const res = await fetch(`/api/clans/gatherings/${gather.gatherNo}/applicants`);
            if (res.ok) {
                const data = await res.json();
                setApplicants(data);
                setSelectedGather(gather);
                setIsApplicantsOpen(true);
            }
        } catch (error) {
            showAlert('인원 정보 조회 실패');
        }
    };

    const handleMatchingClick = (gatherNo: number) => {
        setConfirmMessage('매칭을 시작하시겠습니까?');
        setOnConfirmAction(() => () => executeMatching(gatherNo));
        setIsConfirmOpen(true);
    };

    const executeMatching = async (gatherNo: number) => {
        setIsConfirmOpen(false);
        try {
            const res = await fetch(`/api/clans/gatherings/${gatherNo}/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                showAlert('매핑이 완료되었습니다.');
                fetchAllGatherings();
            } else {
                const err = await res.json();
                showAlert(err.message || '매핑 실패');
            }
        } catch (error) {
            showAlert('오류 발생');
        }
    };

    const handleShowResults = (gather: any) => {
        navigate(`/main/clan/gathering/match-results/${gather.gatherNo}`);
    };

    const handleCompleteClick = (gatherNo: number) => {
        setConfirmMessage('해당 모집을 완전히 종료하시겠습니까? 종료 후에는 되돌릴 수 없습니다.');
        setOnConfirmAction(() => () => executeComplete(gatherNo));
        setIsConfirmOpen(true);
    };

    const executeComplete = async (gatherNo: number) => {
        setIsConfirmOpen(false);
        try {
            const res = await fetch(`/api/clans/gatherings/${gatherNo}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                showAlert('모집이 완전 종료되었습니다.');
                fetchAllGatherings();
            } else {
                const err = await res.json();
                showAlert(err.message || '완전 종료 실패');
            }
        } catch (error) {
            showAlert('오류 발생');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'N': return '모집중';
            case 'Y': return '모집종료';
            case 'M': return '매핑완료';
            case 'E': return '종료';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'N': return 'text-blue-500 bg-blue-50';
            case 'Y': return 'text-orange-500 bg-orange-50';
            case 'M': return 'text-green-500 bg-green-50';
            case 'E': return 'text-gray-500 bg-gray-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 transition-shadow duration-200">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-[#003C48] transition-colors p-2">
                    <FaChevronLeft size={20} />
                </button>
                <h2 className="flex-1 text-center font-bold text-xl text-[#003C48]">합주 모집 관리</h2>
                <div className="w-10"></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                        불러오는 중...
                    </div>
                ) : gatherings.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        등록된 공고가 없습니다.
                    </div>
                ) : (
                    gatherings.map((g) => (
                        <div key={g.gatherNo} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(g.gatherProcFg)}`}>
                                            {getStatusText(g.gatherProcFg)}
                                        </span>
                                        <span className="text-gray-400 text-[10px]">등록일: {g.regDate && `${g.regDate.substring(0, 4)}.${g.regDate.substring(4, 6)}.${g.regDate.substring(6, 8)}`}</span>
                                    </div>
                                    <h3 className="text-[#003C48] font-bold text-lg leading-tight mb-1">{g.title}</h3>
                                    <p className="text-gray-500 text-xs">전체 : {g.applicantCnt || 0}명, 남자 : {g.maleCnt || 0}명, 여자 : {g.femaleCnt || 0}명</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 pt-2">
                                {/* 1. 모집종료 / 모집재개 */}
                                {g.gatherProcFg === 'N' ? (
                                    <button
                                        onClick={() => handleCloseRecruitmentClick(g.gatherNo)}
                                        className="flex flex-col items-center justify-center py-3 rounded-2xl transition-all border bg-orange-50 border-orange-100 text-orange-500 hover:bg-orange-100 active:scale-95 shadow-sm"
                                    >
                                        <FaCheckCircle className="mb-1.5" size={16} />
                                        <span className="text-[10px] font-bold">모집종료</span>
                                    </button>
                                ) : g.gatherProcFg === 'Y' ? (
                                    <button
                                        onClick={() => handleReopenRecruitmentClick(g.gatherNo)}
                                        className="flex flex-col items-center justify-center py-3 rounded-2xl transition-all border bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100 active:scale-95 shadow-sm"
                                    >
                                        <FaRedo className="mb-1.5" size={16} />
                                        <span className="text-[10px] font-bold">모집재개</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="flex flex-col items-center justify-center py-3 rounded-2xl transition-all border bg-gray-50 border-gray-50 text-gray-300"
                                    >
                                        <FaRedo className="mb-1.5" size={16} />
                                        <span className="text-[10px] font-bold">모집재개 불가</span>
                                    </button>
                                )}

                                {/* 2. 합주매핑 / 합주재매핑 */}
                                <button
                                    onClick={() => handleMatchingClick(g.gatherNo)}
                                    disabled={g.gatherProcFg === 'N' || g.gatherProcFg === 'E'}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border shadow-sm ${(g.gatherProcFg === 'Y' || g.gatherProcFg === 'M') ? 'bg-green-50 border-green-100 text-green-500 hover:bg-green-100 active:scale-95' : 'bg-gray-50 border-gray-50 text-gray-300'}`}
                                >
                                    <FaPlay className="mb-1.5" size={16} />
                                    <span className="text-[10px] font-bold">{g.gatherProcFg === 'M' ? '합주재매핑' : '합주매핑'}</span>
                                </button>

                                {/* 3. 합주결과 */}
                                <button
                                    onClick={() => handleShowResults(g)}
                                    disabled={g.gatherProcFg !== 'M' && g.gatherProcFg !== 'E'}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border shadow-sm ${(g.gatherProcFg === 'M' || g.gatherProcFg === 'E') ? 'bg-purple-50 border-purple-100 text-purple-500 hover:bg-purple-100 active:scale-95' : 'bg-gray-50 border-gray-50 text-gray-300'}`}
                                >
                                    <FaListUl className="mb-1.5" size={16} />
                                    <span className="text-[10px] font-bold">합주결과</span>
                                </button>

                                {/* 4. 완전종료 */}
                                <button
                                    onClick={() => handleCompleteClick(g.gatherNo)}
                                    disabled={g.gatherProcFg === 'E' || g.gatherProcFg === 'N'}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all border shadow-sm ${(g.gatherProcFg !== 'E' && g.gatherProcFg !== 'N') ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100 active:scale-95' : 'bg-gray-50 border-gray-50 text-gray-300'}`}
                                >
                                    <FaFlagCheckered className="mb-1.5" size={16} />
                                    <span className="text-[10px] font-bold">완전종료</span>
                                </button>

                                {/* 5. 멤버목록 (인원상세) */}
                                <button
                                    onClick={() => handleShowApplicants(g)}
                                    disabled={g.gatherProcFg === 'E'}
                                    className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all font-bold shadow-sm ${g.gatherProcFg !== 'E' ? 'bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-100 active:scale-95' : 'bg-gray-50 border border-gray-50 text-gray-300'}`}
                                >
                                    <FaUsers className="mb-1.5" size={16} />
                                    <span className="text-[10px]">멤버목록</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Applicants Details Sub-view (Overlay or Animation) */}
            {isApplicantsOpen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center mb-6 pt-2">
                        <button onClick={() => setIsApplicantsOpen(false)} className="text-gray-400 p-2 hover:text-[#003C48] transition-colors">
                            <FaChevronLeft size={24} />
                        </button>
                        <div className="ml-2">
                            <h3 className="font-bold text-xl text-[#003C48]">신청 인원 상세</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{selectedGather?.title}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-10">
                        {applicants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <FaUsers size={48} className="text-gray-200 mb-4" />
                                <p>아직 신청자가 없습니다.</p>
                            </div>
                        ) : (
                            applicants.map((a, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base text-[#003C48]">{a.userNickNm}</span>
                                            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 font-bold">{a.mbti}</span>
                                        </div>
                                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${a.gender === 'M' ? 'text-blue-500 bg-blue-50' : 'text-pink-500 bg-pink-50'}`}>
                                            {a.gender === 'M' ? '남성' : '여성'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded-xl border border-blue-50">
                                            <div className="text-[10px] text-gray-400 mb-1">1지망 세션</div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-500 font-bold text-sm">{a.sessionTypeNm1st}</span>
                                                <span className="text-gray-400 text-xs font-bold">LV.{a.session1stScore}</span>
                                            </div>
                                        </div>
                                        {a.sessionTypeNm2nd && (
                                            <div className="bg-white p-3 rounded-xl border border-green-50">
                                                <div className="text-[10px] text-gray-400 mb-1">2지망 세션</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-500 font-bold text-sm">{a.sessionTypeNm2nd}</span>
                                                    <span className="text-gray-400 text-xs font-bold">LV.{a.session2ndScore}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertOpen(false)}
            />
            <CommonModal
                isOpen={isConfirmOpen}
                type="confirm"
                message={confirmMessage}
                onConfirm={() => {
                    if (onConfirmAction) onConfirmAction();
                    setIsConfirmOpen(false);
                }}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};

export default GatheringManagement;
