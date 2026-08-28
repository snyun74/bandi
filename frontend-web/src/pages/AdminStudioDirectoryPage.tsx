import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSearch, FaSyncAlt, FaExternalLinkAlt, FaMapMarkerAlt, FaPhone, FaCheckCircle, FaTimesCircle, FaTrashAlt } from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface StudioDirItem {
    dirNo: number;
    studioNm: string;
    roadAddress?: string;
    jibunAddress?: string;
    telephone?: string;
    categoryNm?: string;
    linkUrl?: string;
    sido?: string;
    sigungu?: string;
    dong?: string;
    useYn: string;
    insDtime: string;
    updDtime?: string;
}

const AdminStudioDirectoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [studios, setStudios] = useState<StudioDirItem[]>([]);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 모달 상태 관리
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // 합주실 목록 조회 (관리자용: 최신 갱신일시 순)
    const fetchStudios = useCallback(async (searchKw: string, targetPage: number) => {
        setIsLoading(true);
        try {
            const url = `/api/studios/directory/admin/list?keyword=${encodeURIComponent(searchKw)}&page=${targetPage}&size=20`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStudios(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setPage(data.number || 0);
            }
        } catch (e) {
            console.error("Failed to fetch studio directory", e);
            showToast("목록을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudios(keyword, 0);
    }, [keyword, fetchStudios]);

    // 사용 여부 토글 (Y <-> N)
    const handleToggleUseYn = async (dirNo: number, currentUseYn: string) => {
        const nextUseYn = currentUseYn === 'Y' ? 'N' : 'Y';
        try {
            const res = await fetch(`/api/studios/directory/${dirNo}/use-yn?useYn=${nextUseYn}`, {
                method: 'PUT'
            });
            if (res.ok) {
                setStudios(prev => prev.map(item => item.dirNo === dirNo ? { ...item, useYn: nextUseYn } : item));
                showToast(`상태가 '${nextUseYn === 'Y' ? '노출' : '비노출'}'로 변경되었습니다.`);
            } else {
                showToast("상태 변경에 실패했습니다.");
            }
        } catch (e) {
            console.error("Failed to toggle useYn", e);
            showToast("오류가 발생했습니다.");
        }
    };

    // 합주실 갱신 (네이버 기준 일괄 수집/갱신) 실행
    const executeSyncNationwide = async () => {
        closeModal();
        setIsSyncing(true);
        try {
            const res = await fetch('/api/studios/directory/sync/nationwide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                const totalSaved = data.totalSaved || 0;
                const totalUpdated = data.totalUpdated || 0;
                const totalInDb = data.currentTotalCountInDb || 0;
                showToast(`갱신 완료! (신규: ${totalSaved}건, 갱신: ${totalUpdated}건, 총: ${totalInDb}개)`);
                fetchStudios(keyword, 0);
            } else {
                showToast("합주실 갱신 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error("Failed to sync nationwide studios", e);
            showToast("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncNationwide = () => {
        if (isSyncing) return;
        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title: '합주실 데이터 갱신',
            message: '전국 주요 거점의 합주실 데이터를 네이버 플레이스 기준으로 새로 수집 및 갱신하시겠습니까?\n(약 10~15초 소요)',
            onConfirm: executeSyncNationwide
        });
    };

    // 중복 데이터 정리 실행
    const executeCleanDuplicates = async () => {
        closeModal();
        try {
            const res = await fetch('/api/studios/directory/clean-duplicates', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                showToast(`중복 ${data.deletedCount || 0}건이 정리되었습니다.`);
                fetchStudios(keyword, 0);
            }
        } catch (e) {
            showToast("중복 정리에 실패했습니다.");
        }
    };

    const handleCleanDuplicates = () => {
        setModalConfig({
            isOpen: true,
            type: 'confirm',
            title: '중복 합주실 정리',
            message: '상호명과 도로명 주소가 일치하는 중복 합주실을 정리하시겠습니까?\n(중복건 중 1건만 유지됩니다)',
            onConfirm: executeCleanDuplicates
        });
    };

    const formatDate = (dtimeStr?: string) => {
        if (!dtimeStr || dtimeStr.length < 12) return '-';
        return `${dtimeStr.substring(0, 4)}.${dtimeStr.substring(4, 6)}.${dtimeStr.substring(6, 8)} ${dtimeStr.substring(8, 10)}:${dtimeStr.substring(10, 12)}`;
    };

    return (
        <div
            className="flex flex-col bg-[#F8F9FA] font-['Pretendard']"
            style={{
                position: 'fixed',
                top: 'calc(var(--header-height) + var(--safe-top))',
                bottom: 'calc(var(--nav-offset) + var(--safe-bottom))',
                left: 0,
                right: 0,
                fontFamily: '"Pretendard", sans-serif'
            }}
        >
            {/* Header (고정) */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0 z-20 w-full shadow-xs">
                <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/main/admin')} className="text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <FaChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[16px] font-bold text-[#003C48]">전국 합주실 관리</h1>
                            <span className="text-[11px] font-bold bg-[#00BDF8]/10 text-[#00BDF8] px-2 py-0.5 rounded-full">
                                {totalElements}개
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleCleanDuplicates}
                        className="text-[11px] text-gray-500 hover:text-red-500 font-medium px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 transition-colors flex items-center gap-1"
                        title="중복 합주실 정리"
                    >
                        <FaTrashAlt size={10} /> 중복정리
                    </button>
                </div>
            </div>

            {/* Search Input (고정) */}
            <div className="bg-white px-4 py-2.5 border-b border-gray-100 shrink-0 z-10 w-full">
                <div className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="합주실 이름, 지역(홍대, 강남, 부산 등), 도로명 검색"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-all font-medium"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    {keyword && (
                        <button
                            onClick={() => setKeyword('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Body Content (목록만 스크롤) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 max-w-2xl mx-auto w-full pb-24 space-y-3">
                {isLoading && studios.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-xs font-medium">
                        합주실 목록을 불러오는 중입니다...
                    </div>
                ) : studios.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-xs font-medium bg-white rounded-2xl border border-gray-100 p-8">
                        검색된 합주실이 없습니다.
                    </div>
                ) : (
                    studios.map((studio) => {
                        const isUse = studio.useYn === 'Y';
                        const latestTime = studio.updDtime || studio.insDtime;

                        return (
                            <div
                                key={studio.dirNo}
                                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                                    isUse ? 'border-gray-100 hover:border-[#00BDF8]/40' : 'border-gray-200 bg-gray-50/60 opacity-75'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-[14px] font-bold text-[#003C48] truncate">
                                                {studio.studioNm}
                                            </h3>
                                            {studio.sigungu && (
                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {studio.sido} {studio.sigungu}
                                                </span>
                                            )}
                                            {studio.categoryNm && (
                                                <span className="text-[9px] text-gray-400 font-medium truncate max-w-[140px]">
                                                    {studio.categoryNm}
                                                </span>
                                            )}
                                        </div>

                                        {/* Address */}
                                        <div className="mt-2 space-y-0.5 text-[11px] text-gray-600">
                                            {studio.roadAddress && (
                                                <p className="flex items-center gap-1 text-gray-700 font-medium truncate">
                                                    <FaMapMarkerAlt size={11} className="text-[#00BDF8] shrink-0" />
                                                    <span className="truncate">{studio.roadAddress}</span>
                                                </p>
                                            )}
                                            {studio.jibunAddress && (
                                                <p className="text-[10px] text-gray-400 pl-4 truncate">
                                                    (지번) {studio.jibunAddress}
                                                </p>
                                            )}
                                            {studio.telephone && (
                                                <p className="flex items-center gap-1 text-gray-500 text-[11px] pt-1">
                                                    <FaPhone size={10} className="text-gray-400 shrink-0" />
                                                    <span>{studio.telephone}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle & Action */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleUseYn(studio.dirNo, studio.useYn)}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs ${
                                                isUse
                                                    ? 'bg-[#003C48] text-white hover:bg-[#002730]'
                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                            }`}
                                        >
                                            {isUse ? <FaCheckCircle size={11} className="text-[#00BDF8]" /> : <FaTimesCircle size={11} />}
                                            <span>{isUse ? '노출중' : '숨김'}</span>
                                        </button>

                                        {studio.linkUrl && (
                                            <a
                                                href={studio.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-[#03C75A] font-bold hover:underline flex items-center gap-1 bg-[#03C75A]/10 px-2 py-1 rounded-md"
                                            >
                                                네이버 플레이스 <FaExternalLinkAlt size={8} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400">
                                    <span>번호: #{studio.dirNo}</span>
                                    <span>최근 갱신: {formatDate(latestTime)}</span>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-4 pb-2">
                        <button
                            disabled={page === 0}
                            onClick={() => fetchStudios(keyword, page - 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40"
                        >
                            이전
                        </button>
                        <span className="text-xs font-bold text-gray-600">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => fetchStudios(keyword, page + 1)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Fixed Action Bar: "합주실갱신(네이버)" */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] shrink-0 z-30 w-full">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-500 font-medium">
                        총 <strong className="text-[#003C48]">{totalElements}개</strong>의 전국 합주실이 등록되어 있습니다.
                    </div>
                    <button
                        disabled={isSyncing}
                        onClick={handleSyncNationwide}
                        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                            isSyncing
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#03C75A] text-white hover:bg-[#02b350] active:scale-95 shadow-[#03C75A]/20'
                        }`}
                    >
                        <FaSyncAlt size={12} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? '네이버 수집/갱신 중...' : '합주실갱신(네이버)'}</span>
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#003C48] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50 animate-fade-in pointer-events-none">
                    {toastMessage}
                </div>
            )}

            {/* Custom Modal */}
            <CommonModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default AdminStudioDirectoryPage;
