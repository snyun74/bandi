import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaPaperPlane,
    FaAndroid,
    FaApple,
    FaUser,
    FaGlobe,
    FaSearch,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaSyncAlt,
    FaBell
} from 'react-icons/fa';
import CommonModal from '../components/common/CommonModal';

interface DeviceStats {
    totalDeviceCount: number;
    androidCount: number;
    iosCount: number;
    webCount: number;
    totalUserCount: number;
}

interface UserItem {
    userId: string;
    userNm: string;
    userNickNm: string;
    profileImageUrl?: string;
}

interface PushHistoryItem {
    pushLogNo: number;
    userId: string;
    userNickNm: string;
    userNm: string;
    pushTitle: string;
    pushBody: string;
    linkUrl: string;
    sendStatCd: string;
    readYn: string;
    insDtime: string;
}

const AdminPushPage: React.FC = () => {
    const navigate = useNavigate();
    const adminUserId = localStorage.getItem('userId') || '';

    // Device Statistics
    const [stats, setStats] = useState<DeviceStats>({
        totalDeviceCount: 0,
        androidCount: 0,
        iosCount: 0,
        webCount: 0,
        totalUserCount: 0,
    });

    // Push Form States
    const [targetType, setTargetType] = useState<'INDIVIDUAL' | 'ANDROID' | 'IOS' | 'ALL'>('ANDROID');
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [linkUrl, setLinkUrl] = useState('/main');
    const [isSending, setIsSending] = useState(false);

    // User Search Modal / Autocomplete
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);

    // Push History
    const [history, setHistory] = useState<PushHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Modal
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'alert' | 'confirm';
        title?: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const fetchData = async () => {
        try {
            // 1. Device stats
            const statsRes = await fetch('/api/admin/push/device-stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // 2. Users for autocomplete
            const usersRes = await fetch('/api/admin/users/list');
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setAllUsers(usersData);
            }

            // 3. History
            fetchHistory();
        } catch (e) {
            console.error('Failed to load push admin initial data', e);
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/push/history?limit=30');
            if (res.ok) {
                const histData = await res.json();
                setHistory(histData);
            }
        } catch (e) {
            console.error('Failed to fetch push history', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered users for individual target picker
    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return allUsers.slice(0, 30);
        const q = userSearchQuery.toLowerCase();
        return allUsers
            .filter(
                (u) =>
                    (u.userNickNm && u.userNickNm.toLowerCase().includes(q)) ||
                    (u.userNm && u.userNm.toLowerCase().includes(q)) ||
                    (u.userId && u.userId.toLowerCase().includes(q))
            )
            .slice(0, 30);
    }, [allUsers, userSearchQuery]);

    // Handle Send Push
    const handleSendClick = () => {
        if (targetType === 'INDIVIDUAL' && !selectedUser) {
            setModal({
                isOpen: true,
                type: 'alert',
                title: '발송 대상 선택',
                message: '개인 발송 대상 회원을 선택해 주세요.',
                onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
            return;
        }

        if (!title.trim()) {
            setModal({
                isOpen: true,
                type: 'alert',
                title: '입력 확인',
                message: '푸시 제목을 입력해 주세요.',
                onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
            return;
        }

        if (!body.trim()) {
            setModal({
                isOpen: true,
                type: 'alert',
                title: '입력 확인',
                message: '푸시 내용을 입력해 주세요.',
                onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
            return;
        }

        const targetDesc =
            targetType === 'INDIVIDUAL'
                ? `개인 회원 [${selectedUser?.userNickNm || selectedUser?.userId}]`
                : targetType === 'ANDROID'
                ? `안드로이드(Android) 앱 설치 유저 (약 ${stats.androidCount}대 기기)`
                : targetType === 'IOS'
                ? `애플(iOS) 앱스토어 유저 (약 ${stats.iosCount}대 기기)`
                : `전체 유저 (약 ${stats.totalDeviceCount}대 기기)`;

        setModal({
            isOpen: true,
            type: 'confirm',
            title: '푸시 알림 발송 확인',
            message: `다음 대상에게 푸시 알림을 발송하시겠습니까?\n\n• 대상: ${targetDesc}\n• 제목: ${title.trim()}`,
            onConfirm: () => executeSend(),
        });
    };

    const executeSend = async () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
        setIsSending(true);

        try {
            const currentAdmin = adminUserId || localStorage.getItem('userId') || 'admin';
            const res = await fetch('/api/admin/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUserId: currentAdmin,
                    targetType,
                    targetUserId: selectedUser?.userId || null,
                    title: title.trim(),
                    body: body.trim(),
                    linkUrl: linkUrl.trim() || '/main',
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setModal({
                    isOpen: true,
                    type: 'alert',
                    title: '발송 완료',
                    message: data.message || '푸시 알림이 성공적으로 발송되었습니다.',
                    onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
                });
                setTitle('');
                setBody('');
            } else {
                setModal({
                    isOpen: true,
                    type: 'alert',
                    title: '발송 결과',
                    message: data.message || '푸시 알림 발송 중 오류가 발생했습니다.',
                    onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
                });
            }
            fetchHistory();
            const statsRes = await fetch('/api/admin/push/device-stats');
            if (statsRes.ok) setStats(await statsRes.json());
        } catch (e) {
            console.error(e);
            setModal({
                isOpen: true,
                type: 'alert',
                title: '오류 발생',
                message: '서버와 통신하는 중 문제가 발생했습니다.',
                onConfirm: () => setModal((prev) => ({ ...prev, isOpen: false })),
            });
            fetchHistory();
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dtime?: string) => {
        if (!dtime || dtime.length < 12) return dtime || '-';
        // 20260912213012 -> 2026.09.12 21:30
        const y = dtime.substring(0, 4);
        const m = dtime.substring(4, 6);
        const d = dtime.substring(6, 8);
        const hh = dtime.substring(8, 10);
        const mm = dtime.substring(10, 12);
        return `${y}.${m}.${d} ${hh}:${mm}`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-['Pretendard'] text-[#0B1114]">
            {/* 상단 헤더 (스크롤 시 상단에 항상 고정) */}
            <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-[calc(var(--header-height)+var(--safe-top))] z-40 px-4 py-3 flex items-center justify-between shadow-xs transition-all">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/main/admin')}
                        className="p-2 -ml-2 text-gray-700 hover:text-[#00BDF8] transition-colors rounded-lg"
                        aria-label="뒤로가기"
                    >
                        <FaArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <FaPaperPlane className="text-[#00BDF8]" size={16} />
                            메시지 푸시 관리
                        </h1>
                        <p className="text-[11px] text-gray-500">
                            앱 배포 공지 및 타겟별 푸시 알림 발송
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-gray-500 hover:text-[#00BDF8] hover:bg-gray-100 rounded-lg transition-all"
                    title="새로고침"
                >
                    <FaSyncAlt size={14} />
                </button>
            </div>

            <div className="p-4 max-w-4xl mx-auto w-full space-y-4 pb-24">
                {/* 1. 디바이스 등록 현황 통계 카드 (컴팩트 미니 바) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white rounded-xl py-2 px-3 border border-gray-150 shadow-xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FaAndroid size={15} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 font-medium truncate">안드로이드 앱</div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{stats.androidCount.toLocaleString()}대</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-3 border border-gray-150 shadow-xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-800 flex items-center justify-center shrink-0">
                            <FaApple size={15} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 font-medium truncate">애플 (iOS) 앱</div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{stats.iosCount.toLocaleString()}대</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-3 border border-gray-150 shadow-xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#00BDF8] flex items-center justify-center shrink-0">
                            <FaGlobe size={14} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 font-medium truncate">웹(Web) 푸시</div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{stats.webCount.toLocaleString()}대</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl py-2 px-3 border border-gray-150 shadow-xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <FaUser size={13} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 font-medium truncate">전체 등록 유저</div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{stats.totalUserCount.toLocaleString()}명</div>
                        </div>
                    </div>
                </div>

                {/* 2. 푸시 발송 작성 폼 */}
                <div className="bg-white rounded-2xl border border-gray-150 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FaBell className="text-[#00BDF8]" size={15} />
                            푸시 알림 작성
                        </h2>
                        <span className="text-xs text-gray-400">* 필수 입력 항목</span>
                    </div>

                    {/* 발송 대상 선택 (3가지 모드 + 전체) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                            발송 대상 선택 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetType('INDIVIDUAL')}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    targetType === 'INDIVIDUAL'
                                        ? 'border-[#00BDF8] bg-sky-50 text-[#00BDF8] shadow-xs ring-1 ring-[#00BDF8]'
                                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FaUser size={13} />
                                개인 담당자/회원
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('ANDROID')}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    targetType === 'ANDROID'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-xs ring-1 ring-emerald-500'
                                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FaAndroid size={14} />
                                안드로이드 전체
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('IOS')}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    targetType === 'IOS'
                                        ? 'border-gray-800 bg-gray-900 text-white shadow-xs ring-1 ring-gray-900'
                                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <FaApple size={14} />
                                애플 (iOS) 전체
                            </button>
                        </div>
                    </div>

                    {/* 개인 선택 시 회원 선택 UI */}
                    {targetType === 'INDIVIDUAL' && (
                        <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 space-y-2">
                            <label className="block text-xs font-bold text-gray-700">
                                수신 회원 선택 <span className="text-red-500">*</span>
                            </label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between bg-white border border-sky-200 rounded-xl p-2.5 shadow-2xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                                            {selectedUser.profileImageUrl ? (
                                                <img
                                                    src={selectedUser.profileImageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FaUser className="text-gray-400" size={12} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-gray-900 truncate">
                                                {selectedUser.userNickNm || selectedUser.userNm}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate">
                                                ID: {selectedUser.userId}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                        title="선택 해제"
                                    >
                                        <FaTimes size={13} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsUserPickerOpen(true)}
                                    className="w-full py-2.5 px-3 bg-white border border-dashed border-gray-300 rounded-xl text-xs text-gray-600 hover:border-[#00BDF8] hover:text-[#00BDF8] flex items-center justify-center gap-2 transition-all font-semibold"
                                >
                                    <FaSearch size={12} />
                                    수신할 회원을 검색하여 선택하세요
                                </button>
                            )}
                        </div>
                    )}

                    {/* 알림 제목 */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-gray-700">
                                푸시 제목 <span className="text-red-500">*</span>
                            </label>
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTitle('[반디] 새로운 버전이 업데이트되었습니다 🚀')}
                                    className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-medium transition-colors"
                                >
                                    + 업데이트 공지
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTitle('[반디] 서비스 점검 안내 ⚠️')}
                                    className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 font-medium transition-colors"
                                >
                                    + 점검 안내
                                </button>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: [반디] 신규 기능 업데이트 및 안정화 버전 배포"
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-colors"
                            maxLength={60}
                        />
                    </div>

                    {/* 알림 본문 */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-gray-700">
                                푸시 내용 (메시지) <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] text-gray-400">{body.length} / 250자</span>
                        </div>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="알림으로 전달할 상세 내용을 입력해 주세요. (앱스토어/구글플레이 업데이트 안내 등)"
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-colors h-28 resize-none leading-relaxed"
                            maxLength={250}
                        />
                    </div>

                    {/* 클릭 시 이동 링크 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            클릭 시 이동 링크 (URL)
                        </label>
                        <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="/main or https://..."
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00BDF8] focus:bg-white transition-colors font-mono"
                        />
                    </div>

                    {/* 발송 버튼 */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleSendClick}
                            disabled={isSending}
                            className="w-full py-3.5 bg-[#00BDF8] hover:bg-[#00a6da] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                        >
                            <FaPaperPlane size={14} />
                            {isSending ? '푸시 발송 중...' : '푸시 알림 즉시 발송하기'}
                        </button>
                    </div>
                </div>

                {/* 3. 최근 푸시 발송 이력 목록 */}
                <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FaSyncAlt className="text-[#00BDF8]" size={13} />
                            최근 푸시 발송 이력 (최근 30건)
                        </h2>
                        <button
                            onClick={fetchHistory}
                            className="text-xs text-[#00BDF8] hover:underline font-semibold"
                        >
                            새로고침
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                            이력을 불러오는 중입니다...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                            발송된 푸시 알림 이력이 없습니다.
                        </div>
                    ) : (
                        <>
                            {/* 1) 모바일 뷰 (가로 스크롤 없이 한눈에 볼 수 있는 카드 리스트) */}
                            <div className="sm:hidden space-y-2.5">
                                {history.map((item) => (
                                    <div
                                        key={item.pushLogNo}
                                        className="bg-gray-50/80 rounded-xl p-3 border border-gray-150/80 space-y-1.5 text-xs"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-bold text-gray-900 truncate">
                                                    {item.userNickNm || item.userId}
                                                </span>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {formatTime(item.insDtime)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {item.sendStatCd === '01' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                        <FaCheckCircle size={9} /> 성공
                                                    </span>
                                                ) : item.sendStatCd === '02' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
                                                        <FaExclamationCircle size={9} /> 실패
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                                        전송중
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        item.readYn === 'Y' ? 'bg-sky-50 text-[#00BDF8]' : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                >
                                                    {item.readYn === 'Y' ? '읽음' : '미확인'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="font-semibold text-gray-900 line-clamp-1">
                                            {item.pushTitle}
                                        </div>
                                        <div className="text-gray-600 text-[11px] line-clamp-2 leading-relaxed bg-white p-2 rounded-lg border border-gray-100">
                                            {item.pushBody}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 2) PC / 태블릿 뷰 (정돈된 테이블) */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 text-gray-500 border-y border-gray-100">
                                        <tr>
                                            <th className="py-2.5 px-3">발송일시</th>
                                            <th className="py-2.5 px-3">수신 회원</th>
                                            <th className="py-2.5 px-3">푸시 제목</th>
                                            <th className="py-2.5 px-3">푸시 본문</th>
                                            <th className="py-2.5 px-3 text-center">상태</th>
                                            <th className="py-2.5 px-3 text-center">읽음</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((item) => (
                                            <tr key={item.pushLogNo} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                                                    {formatTime(item.insDtime)}
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                    {item.userNickNm || item.userId}
                                                </td>
                                                <td className="py-3 px-3 font-bold text-gray-900 max-w-[160px] truncate">
                                                    {item.pushTitle}
                                                </td>
                                                <td className="py-3 px-3 text-gray-600 max-w-[240px] truncate">
                                                    {item.pushBody}
                                                </td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    {item.sendStatCd === '01' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                            <FaCheckCircle size={9} /> 성공
                                                        </span>
                                                    ) : item.sendStatCd === '02' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
                                                            <FaExclamationCircle size={9} /> 실패
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                                            전송중
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={`text-[10px] font-bold ${
                                                            item.readYn === 'Y' ? 'text-[#00BDF8]' : 'text-gray-400'
                                                        }`}
                                                    >
                                                        {item.readYn === 'Y' ? '읽음' : '미확인'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 회원 검색 및 선택 모달 */}
            {isUserPickerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-fade-in-up">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900">푸시 수신 회원 선택</h3>
                            <button
                                onClick={() => setIsUserPickerOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    placeholder="닉네임, 이름, 아이디로 검색..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#00BDF8] focus:bg-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-3 overflow-y-auto divide-y divide-gray-100 flex-1">
                            {filteredUsers.length === 0 ? (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    검색된 회원이 없습니다.
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.userId}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsUserPickerOpen(false);
                                        }}
                                        className="p-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                                                {user.profileImageUrl ? (
                                                    <img
                                                        src={user.profileImageUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FaUser className="text-gray-400" size={13} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-gray-900 truncate">
                                                    {user.userNickNm || user.userNm}
                                                </div>
                                                <div className="text-[10px] text-gray-500 truncate">
                                                    ID: {user.userId} ({user.userNm})
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-2.5 py-1 text-[11px] font-bold text-[#00BDF8] bg-sky-50 border border-sky-200 rounded-lg hover:bg-[#00BDF8] hover:text-white transition-all shrink-0"
                                        >
                                            선택
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
                            <button
                                onClick={() => setIsUserPickerOpen(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 공통 알림/확인 모달 */}
            <CommonModal
                isOpen={modal.isOpen}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminPushPage;
