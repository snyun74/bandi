import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaMusic, FaPlus, FaTrash, FaBell, FaArrowRight } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

// Local custom modal for advanced content
const CustomAdminModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    confirmText: string;
    onConfirm: () => void;
    showCancel?: boolean;
}> = ({ isOpen, onClose, title, children, confirmText, onConfirm, showCancel = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-[#052c42] mb-4">{title}</h3>
                    <div className="mb-6">{children}</div>
                    <div className={`grid ${showCancel ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                        {showCancel && (
                            <button onClick={onClose} className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">
                                취소
                            </button>
                        )}
                        <button onClick={onConfirm} className="w-full py-3 px-4 bg-[#00BDF8] hover:bg-[#009acb] text-white rounded-xl font-semibold transition-colors">
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface JamItem {
    bnNo: number;
    bnType: string;
    clanNm?: string;
    bnNm: string;
    bnSongNm: string;
    bnSingerNm: string;
    bnStatCd: string;
    bnConfFg: string;
    formattedStatus: string;
}

interface SessionItem {
    bnSessionNo: number;
    bnNo: number;
    bnSessionTypeCd: string;
    bnSessionJoinUserId?: string;
}

interface CommDetail {
    commDtlCd: string;
    commDtlNm: string;
    commOrder: number;
}

const AdminJamManagement: React.FC = () => {
    const navigate = useNavigate();

    const [jams, setJams] = useState<JamItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // Modals
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [selectedJamId, setSelectedJamId] = useState<number | null>(null);

    const [commonSessions, setCommonSessions] = useState<CommDetail[]>([]);
    
    // Modal States
    const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
    const [selectedSessionType, setSelectedSessionType] = useState('');

    const [isDeleteSessionModalOpen, setIsDeleteSessionModalOpen] = useState(false);
    const [jamSessions, setJamSessions] = useState<SessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const [isPushModalOpen, setIsPushModalOpen] = useState(false);
    const [pushMessage, setPushMessage] = useState('합주방이 확정됐어요! 대화를 시작해보세요!');

    const observerTarget = useRef<HTMLDivElement | null>(null);

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const fetchJams = useCallback(async (currentPage: number, keyword: string, reset: boolean = false) => {
        if (loading || (!hasMore && !reset)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/jams?page=${currentPage}&size=30&searchKeyword=${encodeURIComponent(keyword)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.length < 30) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

                if (reset) {
                    setJams(data);
                } else {
                    setJams(prev => {
                        const existingIds = new Set(prev.map(j => j.bnNo));
                        const newJams = data.filter((j: JamItem) => !existingIds.has(j.bnNo));
                        return [...prev, ...newJams];
                    });
                }
            } else {
                showAlert('합주 목록을 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to fetch jams', error);
            showAlert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchCommonSessions = async () => {
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
                    setCommonSessions(data);
                    if (data.length > 0) {
                        setSelectedSessionType(data[0].commDtlCd);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch BD100 codes", error);
            }
        };
        fetchCommonSessions();
    }, []);

    useEffect(() => {
        fetchJams(0, searchKeyword, true);
        setPage(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKeyword]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prevPage => {
                        const nextPage = prevPage + 1;
                        fetchJams(nextPage, searchKeyword, false);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        const currentTarget = observerTarget.current;
        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
        };
    }, [hasMore, loading, searchKeyword, fetchJams]);

    const handleSearch = () => {
        setSearchKeyword(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- ACTIONS ---

    const openAddSessionModal = (bnNo: number) => {
        setSelectedJamId(bnNo);
        if (commonSessions.length > 0) {
            setSelectedSessionType(commonSessions[0].commDtlCd);
        }
        setIsAddSessionModalOpen(true);
    };

    const handleAddSession = async () => {
        if (!selectedJamId) return;
        const userId = localStorage.getItem('userId') || 'admin';
        try {
            const res = await fetch(`/api/admin/jams/${selectedJamId}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionTypeCd: selectedSessionType, userId })
            });
            if (res.ok) {
                showAlert('세션이 성공적으로 추가되었습니다.');
                setIsAddSessionModalOpen(false);
            } else {
                showAlert('세션 추가에 실패했습니다.');
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };

    const openDeleteSessionModal = async (bnNo: number) => {
        setSelectedJamId(bnNo);
        setJamSessions([]);
        setSessionsLoading(true);
        setIsDeleteSessionModalOpen(true);

        try {
            const res = await fetch(`/api/admin/jams/${bnNo}/sessions`);
            if (res.ok) {
                setJamSessions(await res.json());
            } else {
                showAlert('세션 목록을 가져오지 못했습니다.');
                setIsDeleteSessionModalOpen(false);
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
            setIsDeleteSessionModalOpen(false);
        } finally {
            setSessionsLoading(false);
        }
    };

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

    const promptDeleteSession = (sessionNo: number) => {
        setSessionToDelete(sessionNo);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteSession = async () => {
        if (!selectedJamId || !sessionToDelete) return;

        try {
            const res = await fetch(`/api/admin/jams/${selectedJamId}/sessions/${sessionToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setJamSessions(prev => prev.filter(s => s.bnSessionNo !== sessionToDelete));
                showAlert('세션이 삭제되었습니다.');
            } else {
                showAlert('세션 삭제에 실패했습니다.');
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        } finally {
            setIsDeleteConfirmOpen(false);
            setSessionToDelete(null);
        }
    };

    const openPushModal = (bnNo: number) => {
        setSelectedJamId(bnNo);
        setPushMessage('합주방이 확정됐어요! 대화를 시작해보세요!');
        setIsPushModalOpen(true);
    };

    const handleSendPush = async () => {
        if (!selectedJamId || !pushMessage.trim()) return;
        const adminUserId = localStorage.getItem('userId') || 'admin';

        try {
            const res = await fetch(`/api/admin/jams/${selectedJamId}/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pushMessage, adminUserId })
            });
            if (res.ok) {
                showAlert('푸시 알림이 발송되었습니다.');
                setIsPushModalOpen(false);
            } else {
                showAlert('푸시 알림 발송에 실패했습니다.');
            }
        } catch (e) {
            showAlert('오류가 발생했습니다.');
        }
    };

    const getSessionLabel = (cd: string) => {
        const found = commonSessions.find(s => s.commDtlCd === cd);
        return found ? found.commDtlNm : cd;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f2f4f5] font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            <div className="flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="flex items-center">
                    <button onClick={() => navigate('/main/admin')} className="mr-3 text-[#052c42]">
                        <FaChevronLeft size={22} />
                    </button>
                    <h1 className="text-[14px] font-bold text-[#052c42]">합주 관리</h1>
                </div>
            </div>

            <div className="p-4 flex-1">
                {/* Search Header */}
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="pl-3 text-gray-400"><FaSearch /></div>
                        <input
                            type="text"
                            className="flex-1 bg-transparent p-3 outline-none text-sm placeholder-gray-400"
                            placeholder="합주명, 가수, 작곡, 클랜명 검색"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-[#00BDF8] text-white px-4 h-full py-3 text-sm font-bold hover:bg-[#009acb] transition-colors"
                        >
                            검색
                        </button>
                    </div>
                </div>

                {/* List Body */}
                <div className="space-y-3">
                    {jams.map(jam => (
                        <div key={jam.bnNo} className="bg-white rounded-2xl p-4 shadow-sm relative border border-white hover:border-[#00BDF8]/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {jam.bnType === 'FREE' ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-600">
                                            자유합주
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-600">
                                            {jam.clanNm || '클랜합주'}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">ID: {jam.bnNo}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    jam.formattedStatus === '확정' ? 'bg-green-100 text-green-700' :
                                    jam.formattedStatus === '삭제' ? 'bg-red-100 text-red-700' :
                                    jam.formattedStatus === '종료' ? 'bg-gray-100 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {jam.formattedStatus}
                                </span>
                            </div>
                            
                            <h3 className="text-[16px] font-bold text-[#003C48] mb-1 leading-tight">{jam.bnNm}</h3>
                            <p className="text-sm text-gray-500 mb-3 truncate">
                                <span className="font-medium">{jam.bnSingerNm}</span> - {jam.bnSongNm}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/main/clan/jam/room/${jam.bnNo}`)}
                                    className="flex items-center gap-1 bg-white border border-gray-200 text-[#003C48] px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-gray-50 flex-1 justify-center whitespace-nowrap"
                                >
                                    <FaArrowRight size={10} /> 합주이동
                                </button>
                                <button
                                    onClick={() => openAddSessionModal(jam.bnNo)}
                                    className="flex items-center gap-1 bg-white border border-[#00BDF8] text-[#00BDF8] px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-blue-50 flex-1 justify-center whitespace-nowrap"
                                >
                                    <FaPlus size={10} /> 세션추가
                                </button>
                                <button
                                    onClick={() => openDeleteSessionModal(jam.bnNo)}
                                    className="flex items-center gap-1 bg-white border border-red-400 text-red-500 px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-red-50 flex-1 justify-center whitespace-nowrap"
                                >
                                    <FaTrash size={10} /> 세션삭제
                                </button>
                                <button
                                    onClick={() => openPushModal(jam.bnNo)}
                                    className="flex items-center gap-1 bg-[#00BDF8] text-white px-3 py-1.5 rounded-full text-[12px] font-bold hover:bg-[#009acb] shadow-sm flex-1 justify-center whitespace-nowrap"
                                >
                                    <FaBell size={10} /> 푸시알림
                                </button>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="text-center p-4 text-sm text-gray-400">불로오는 중...</div>}
                    {!loading && jams.length === 0 && <div className="text-center p-10 text-gray-400">등록된 합주가 없습니다.</div>}
                    <div ref={observerTarget} className="h-[10px]" />
                </div>
            </div>

            {/* Session Add Modal */}
            <CustomAdminModal
                isOpen={isAddSessionModalOpen}
                onClose={() => setIsAddSessionModalOpen(false)}
                title="세션 추가"
                confirmText="추가"
                onConfirm={handleAddSession}
            >
                <div className="p-2">
                    <p className="text-sm text-gray-600 mb-3">추가할 세션 유형을 선택해 주세요.</p>
                    <select
                        value={selectedSessionType}
                        onChange={(e) => setSelectedSessionType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#00BDF8]"
                    >
                        {commonSessions.map(s => (
                            <option key={s.commDtlCd} value={s.commDtlCd}>{s.commDtlNm}</option>
                        ))}
                    </select>
                </div>
            </CustomAdminModal>

            {/* Session Delete Modal */}
            <CustomAdminModal
                isOpen={isDeleteSessionModalOpen}
                onClose={() => setIsDeleteSessionModalOpen(false)}
                title="세션 삭제"
                confirmText="닫기"
                onConfirm={() => setIsDeleteSessionModalOpen(false)}
                showCancel={false}
            >
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {sessionsLoading ? (
                        <div className="text-center text-sm text-gray-400 py-4">조회 중...</div>
                    ) : jamSessions.length === 0 ? (
                        <div className="text-center text-sm text-gray-400 py-4">등록된 세션이 없습니다.</div>
                    ) : (
                        <ul className="space-y-2">
                            {jamSessions.map(session => (
                                <li key={session.bnSessionNo} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <span className="font-bold text-[#003C48] text-sm mr-2">{getSessionLabel(session.bnSessionTypeCd)}</span>
                                        <span className="text-xs text-gray-500">
                                            {session.bnSessionJoinUserId ? `(참여자: ${session.bnSessionJoinUserId})` : '(빈 세션)'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => promptDeleteSession(session.bnSessionNo)}
                                        className="text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </CustomAdminModal>

            {/* Push Modal */}
            <CustomAdminModal
                isOpen={isPushModalOpen}
                onClose={() => setIsPushModalOpen(false)}
                title="푸시 알림 발송"
                confirmText="발송"
                onConfirm={handleSendPush}
            >
                <div className="p-2">
                    <p className="text-sm text-gray-600 mb-3">발송할 메시지를 확인하고 수정할 수 있습니다.</p>
                    <textarea
                        value={pushMessage}
                        onChange={(e) => setPushMessage(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#00BDF8] resize-none h-24"
                        placeholder="전송할 내용을 입력하세요"
                    />
                </div>
            </CustomAdminModal>

            <CommonModal
                isOpen={isAlertOpen}
                type="alert"
                message={alertMessage}
                onConfirm={() => setIsAlertOpen(false)}
            />

            <CommonModal
                isOpen={isDeleteConfirmOpen}
                type="confirm"
                message="정말로 이 세션을 삭제하시겠습니까?"
                onConfirm={confirmDeleteSession}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </div>
    );
};

export default AdminJamManagement;
