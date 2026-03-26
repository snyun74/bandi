import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaTrash, FaCheck, FaTimes, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

// ... (interfaces remain same)
interface Report {
    reportNo: number;
    reportUserId: string;
    reportUserNickNm: string;
    targetUserId: string;
    targetUserNickNm: string;
    boardUrl: string;
    content: string;
    reportDtime: string;
    procStatFg: string; // N, Y, R
}

interface Block {
    userId: string;
    userNickNm: string;
    blockUserId: string;
    blockUserNickNm: string;
    blockDtime: string;
}

const AdminReportBlockPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'report' | 'block'>('report');
    
    // Report state
    const [reports, setReports] = useState<Report[]>([]);
    const [reportPage, setReportPage] = useState(0);
    const [hasMoreReports, setHasMoreReports] = useState(true);
    const [reportSearch, setReportSearch] = useState("");
    const [reportSearchInput, setReportSearchInput] = useState("");

    // Block state
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [blockPage, setBlockPage] = useState(0);
    const [hasMoreBlocks, setHasMoreBlocks] = useState(true);
    const [blockSearch, setBlockSearch] = useState("");
    const [blockSearchInput, setBlockSearchInput] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Modal state
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'confirm' | 'alert';
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        message: '',
        onConfirm: () => { }
    });

    const currentUserId = localStorage.getItem('userId');

    // Fetching logic
    useEffect(() => {
        if (activeTab === 'report') {
            fetchReports(0, reportSearch, false);
            setReportPage(0);
        } else {
            fetchBlocks(0, blockSearch, false);
            setBlockPage(0);
        }
    }, [activeTab, reportSearch, blockSearch]);

    useEffect(() => {
        if (reportPage > 0 && activeTab === 'report') {
            fetchReports(reportPage, reportSearch, true);
        }
    }, [reportPage]);

    useEffect(() => {
        if (blockPage > 0 && activeTab === 'block') {
            fetchBlocks(blockPage, blockSearch, true);
        }
    }, [blockPage]);

    const fetchReports = async (page: number, search: string, append: boolean) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/clans/reports?page=${page}&size=30&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                const newReports = data.content;
                if (append) {
                    setReports(prev => [...prev, ...newReports]);
                } else {
                    setReports(newReports);
                }
                setHasMoreReports(!data.last);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBlocks = async (page: number, search: string, append: boolean) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/clans/blocks?page=${page}&size=30&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                const newBlocks = data.content;
                if (append) {
                    setBlocks(prev => [...prev, ...newBlocks]);
                } else {
                    setBlocks(newBlocks);
                }
                setHasMoreBlocks(!data.last);
            }
        } catch (error) {
            console.error("Failed to fetch blocks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (activeTab === 'report') {
            setReportSearch(reportSearchInput);
        } else {
            setBlockSearch(blockSearchInput);
        }
    };

    // Infinite Scroll Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && (activeTab === 'report' ? hasMoreReports : hasMoreBlocks)) {
                if (activeTab === 'report') setReportPage(prev => prev + 1);
                else setBlockPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMoreReports, hasMoreBlocks, activeTab]);

    const handleUpdateReportStatus = async (reportNo: number, status: string) => {
        const statusText = status === 'Y' ? '처리' : '거부';
        setModal({
            isOpen: true,
            type: 'confirm',
            message: `해당 신고를 ${statusText}하시겠습니까?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/clans/reports/${reportNo}/status?status=${status}&userId=${currentUserId}`, {
                        method: 'PUT'
                    });
                    if (res.ok) {
                        setModal({
                            isOpen: true,
                            type: 'alert',
                            message: `${statusText} 완료되었습니다.`,
                            onConfirm: () => {
                                setModal(prev => ({ ...prev, isOpen: false }));
                                fetchReports(0, reportSearch, false);
                                setReportPage(0);
                                setIsDetailOpen(false);
                            }
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleDeleteBlock = async (userId: string, blockUserId: string, userNick: string, blockNick: string) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            message: `${userNick}님의 ${blockNick}님 차단을 해제하시겠습니까?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/clans/blocks?userId=${userId}&blockUserId=${blockUserId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        setModal({
                            isOpen: true,
                            type: 'alert',
                            message: "차단이 해제되었습니다.",
                            onConfirm: () => {
                                setModal(prev => ({ ...prev, isOpen: false }));
                                fetchBlocks(0, blockSearch, false);
                                setBlockPage(0);
                            }
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr.length < 12) return dateStr;
        return `${dateStr.substring(2, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)} ${dateStr.substring(8, 10)}:${dateStr.substring(10, 12)}`;
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'N': return <span className="text-orange-500 font-bold">신규</span>;
            case 'Y': return <span className="text-blue-500 font-bold">처리완료</span>;
            case 'R': return <span className="text-gray-400 font-bold">거부</span>;
            default: return status;
        }
    };

    const handleUrlNavigate = (url: string) => {
        try {
            if (url.startsWith('http')) {
                const urlObj = new URL(url);
                if (urlObj.origin === window.location.origin) {
                    navigate(urlObj.pathname + urlObj.search);
                } else {
                    window.location.href = url;
                }
            } else {
                navigate(url);
            }
        } catch (e) {
            console.error("Navigation error", e);
            navigate(url);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                <button onClick={() => navigate('/main/admin')} className="text-gray-600 mr-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                    신고/차단 관리
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex bg-white px-4 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'report' ? 'border-[#00BDF8] text-[#00BDF8]' : 'border-transparent text-gray-400'}`}
                >
                    신고 관리
                </button>
                <button
                    onClick={() => setActiveTab('block')}
                    className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'block' ? 'border-[#00BDF8] text-[#00BDF8]' : 'border-transparent text-gray-400'}`}
                >
                    차단 관리
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex gap-2">
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        placeholder={activeTab === 'report' ? "신고자/피신고자 닉네임 또는 아이디" : "차단자/피차단자 닉네임 또는 아이디"}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#00BDF8] transition-all"
                        value={activeTab === 'report' ? reportSearchInput : blockSearchInput}
                        onChange={(e) => activeTab === 'report' ? setReportSearchInput(e.target.value) : setBlockSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                </div>
                <button 
                    onClick={handleSearch}
                    className="bg-[#00BDF8] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00aee5] transition-colors"
                >
                    검색
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && reports.length === 0 && blocks.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
                ) : (
                    <div className="space-y-3">
                        {activeTab === 'report' ? (
                            reports.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">신고 내역이 없습니다.</div>
                            ) : (
                                <>
                                    {reports.map((r, index) => (
                                        <div 
                                            key={r.reportNo} 
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-[#00BDF8]/30 transition-all cursor-pointer"
                                            ref={index === reports.length - 1 ? lastElementRef : null}
                                            onClick={() => {
                                                setSelectedReport(r);
                                                setIsDetailOpen(true);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getStatusText(r.procStatFg)}
                                                    <span className="text-[10px] text-gray-400">{formatDate(r.reportDtime)}</span>
                                                </div>
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => handleUpdateReportStatus(r.reportNo, 'Y')}
                                                        className={`p-1.5 rounded-lg transition-colors ${r.procStatFg === 'Y' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}
                                                        title="처리"
                                                    >
                                                        <FaCheck size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateReportStatus(r.reportNo, 'R')}
                                                        className={`p-1.5 rounded-lg transition-colors ${r.procStatFg === 'R' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                        title="거부"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                                <span className="font-bold text-gray-800">{r.reportUserNickNm || "익명"}({r.reportUserId})</span>
                                                <span className="text-gray-300">→</span>
                                                <span className="font-bold text-red-600">{r.targetUserNickNm || "익명"}({r.targetUserId})</span>
                                            </div>
                                            <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleUrlNavigate(r.boardUrl)}
                                                    className="text-[11px] text-blue-500 hover:underline break-all block text-left"
                                                >
                                                    {r.boardUrl}
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                                                {r.content}
                                            </p>
                                        </div>
                                    ))}
                                    {isLoading && <div className="text-center py-4 text-gray-400 text-sm">추가 내역 로딩 중...</div>}
                                </>
                            )
                        ) : (
                            blocks.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">차단 내역이 없습니다.</div>
                            ) : (
                                <>
                                    {blocks.map((b, idx) => (
                                        <div 
                                            key={idx} 
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                                            ref={idx === blocks.length - 1 ? lastElementRef : null}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                                    <span className="font-bold text-gray-800">{b.userNickNm || "익명"}({b.userId})</span>
                                                    <span className="text-gray-300">님이</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span className="font-bold text-red-600">{b.blockUserNickNm || "익명"}({b.blockUserId})</span>
                                                    <span className="text-gray-300">님을 차단함</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-2">{formatDate(b.blockDtime)}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteBlock(b.userId, b.blockUserId, b.userNickNm, b.blockUserNickNm)}
                                                className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                                                title="차단 해제"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {isLoading && <div className="text-center py-4 text-gray-400 text-sm">추가 내역 로딩 중...</div>}
                                </>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {isDetailOpen && selectedReport && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-[#F9FAFB] flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FaExclamationTriangle className="text-orange-500" />
                                신고 상세 정보
                            </h2>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-400">
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">신고자</label>
                                    <span className="text-xs font-bold text-gray-800">{selectedReport.reportUserNickNm}({selectedReport.reportUserId})</span>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">신고대상</label>
                                    <span className="text-xs font-bold text-red-600">{selectedReport.targetUserNickNm}({selectedReport.targetUserId})</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">신고일시</label>
                                <span className="text-xs text-gray-600">{formatDate(selectedReport.reportDtime)}</span>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">게시글 URL</label>
                                <button 
                                    onClick={() => handleUrlNavigate(selectedReport.boardUrl)}
                                    className="text-xs text-blue-500 break-all underline text-left block"
                                >
                                    {selectedReport.boardUrl}
                                </button>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 block mb-1">신고내용</label>
                                <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {selectedReport.content}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => handleUpdateReportStatus(selectedReport.reportNo, 'R')}
                                className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-xs border ${selectedReport.procStatFg === 'R' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-red-500 hover:bg-red-50'}`}
                            >
                                반려(거부)
                            </button>
                            <button
                                onClick={() => handleUpdateReportStatus(selectedReport.reportNo, 'Y')}
                                className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-xs shadow-md ${selectedReport.procStatFg === 'Y' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-[#00BDF8] text-white hover:bg-[#00aee5]'}`}
                            >
                                접수(처리)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminReportBlockPage;
