import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronLeft, FaPlus, FaImage, FaPlayCircle, FaUpload, FaExternalLinkAlt, FaLink, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../components/common/CommonModal';
import { validateFileSize } from '../utils/fileUtils';

/** 배너 정보 (CM_AD_BANNER) */
interface AdBanner {
    adBannerNo: number;
    adBannerCd: string;
    adBannerNm: string;
    attachNo: number;
    fileUrl: string | null;
    mimeType: string | null;
    adBannerLinkUrl: string | null;
    linkTargetFg: 'I' | 'O';
    sortSeq: number;
    sttDate: string; // YYYYMMDD
    endDate: string; // YYYYMMDD
    useYn: 'Y' | 'N';
    bannerStatCd: string;
    insDtime: string;
    updDtime: string;
}

interface CodeItem {
    commDtlCd: string;
    commDtlNm: string;
}

/** 등록/수정 폼 상태 (날짜는 input[type=date] 형식 YYYY-MM-DD) */
interface BannerForm {
    adBannerNo: number | null;
    adBannerCd: string;
    adBannerNm: string;
    adBannerLinkUrl: string;
    linkTargetFg: 'I' | 'O';
    sortSeq: string;
    sttDate: string;
    endDate: string;
    useYn: 'Y' | 'N';
    bannerStatCd: string;
    fileUrl: string | null;
    mimeType: string | null;
}

type DisplayStatus = 'ON' | 'READY' | 'ENDED' | 'OFF' | 'HOLD';

// 배너 위치코드 기본 목록 (등록된 배너의 위치코드도 자동으로 추가 표시)
const DEFAULT_POSITIONS = ['MAIN'];
// 배너상태코드(BD004) 조회 실패 시 기본값
const DEFAULT_STAT_CODES: CodeItem[] = [{ commDtlCd: 'A', commDtlNm: '정상' }];
// 노출 대상 상태코드 (서버 노출 조건과 동일)
const DISPLAY_STAT_CD = 'A';

/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
const todayKst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const addDays = (ymdDash: string, days: number) => {
    const d = new Date(`${ymdDash}T00:00:00`);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const toDash = (ymd: string) => (ymd && ymd.length === 8 ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : '');
const toDot = (ymd: string) => (ymd && ymd.length === 8 ? `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}` : '-');
const isVideoMedia = (mimeType: string | null, url: string | null) =>
    !!mimeType?.startsWith('video/') || (!!url && /\.(mp4|webm|ogg|mov)$/i.test(url));

/** 노출 상태 계산 (사용여부 → 상태코드 → 노출기간 순) */
const getDisplayStatus = (b: AdBanner, today: string): DisplayStatus => {
    if (b.useYn !== 'Y') return 'OFF';
    if (b.bannerStatCd !== DISPLAY_STAT_CD) return 'HOLD';
    const t = today.replace(/-/g, '');
    if (t < b.sttDate) return 'READY';
    if (t > b.endDate) return 'ENDED';
    return 'ON';
};

const STATUS_META: Record<DisplayStatus, { label: string; className: string }> = {
    ON: { label: '노출중', className: 'bg-green-100 text-green-700' },
    READY: { label: '노출예정', className: 'bg-sky-100 text-sky-700' },
    ENDED: { label: '기간종료', className: 'bg-gray-100 text-gray-500' },
    OFF: { label: '중지', className: 'bg-gray-200 text-gray-600' },
    HOLD: { label: '노출제외', className: 'bg-orange-100 text-orange-700' },
};

const STATUS_FILTERS: { key: 'ALL' | DisplayStatus; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'ON', label: '노출중' },
    { key: 'READY', label: '노출예정' },
    { key: 'ENDED', label: '기간종료' },
    { key: 'OFF', label: '중지' },
];

const emptyForm = (): BannerForm => {
    const today = todayKst();
    return {
        adBannerNo: null,
        adBannerCd: 'MAIN',
        adBannerNm: '',
        adBannerLinkUrl: '',
        linkTargetFg: 'I',
        sortSeq: '1',
        sttDate: today,
        endDate: addDays(today, 30),
        useYn: 'Y',
        bannerStatCd: DISPLAY_STAT_CD,
        fileUrl: null,
        mimeType: null,
    };
};

/** 서버 오류 응답에서 메시지 추출 */
const readErrorMessage = async (res: Response, fallback: string) => {
    try {
        const data = await res.json();
        return data?.message || fallback;
    } catch {
        return fallback;
    }
};

const AdminBannerPage: React.FC = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || '';

    const [banners, setBanners] = useState<AdBanner[]>([]);
    const [statCodes, setStatCodes] = useState<CodeItem[]>(DEFAULT_STAT_CODES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 목록 필터
    const [positionFilter, setPositionFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | DisplayStatus>('ALL');

    // 등록/수정 폼
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<BannerForm>(emptyForm());
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // 알림 / 확인 / 미리보기
    const [alertMessage, setAlertMessage] = useState('');
    const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
    const [preview, setPreview] = useState<{ url: string; isVideo: boolean } | null>(null);

    const today = todayKst();

    useEffect(() => {
        fetchBanners();
        fetchStatCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 선택한 로컬 파일 미리보기 URL 정리
    useEffect(() => {
        if (!selectedFile) {
            setLocalPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const fetchBanners = async () => {
        if (!userId) {
            setAlertMessage('로그인 정보가 없습니다.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/banners?userId=${encodeURIComponent(userId)}`);
            if (res.ok) {
                setBanners(await res.json());
            } else {
                setAlertMessage(await readErrorMessage(res, '배너 목록을 불러오지 못했습니다.'));
            }
        } catch (error) {
            console.error(error);
            setAlertMessage('서버와 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatCodes = async () => {
        try {
            const res = await fetch('/api/common/codes/BD004');
            if (!res.ok) return;
            const data: CodeItem[] = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setStatCodes(data.map(d => ({ commDtlCd: d.commDtlCd, commDtlNm: d.commDtlNm })));
            }
        } catch (error) {
            console.warn('배너 상태코드(BD004) 조회 실패, 기본값 사용', error);
        }
    };

    const statName = (cd: string) => statCodes.find(c => c.commDtlCd === cd)?.commDtlNm || cd;

    // 위치코드 목록 = 기본 위치 + 등록된 배너의 위치
    const positions = useMemo(() => {
        const set = new Set<string>(DEFAULT_POSITIONS);
        banners.forEach(b => set.add(b.adBannerCd));
        return Array.from(set);
    }, [banners]);

    const filteredBanners = useMemo(() => banners.filter(b => {
        if (positionFilter !== 'ALL' && b.adBannerCd !== positionFilter) return false;
        if (statusFilter !== 'ALL' && getDisplayStatus(b, today) !== statusFilter) return false;
        return true;
    }), [banners, positionFilter, statusFilter, today]);

    const onCount = useMemo(() => banners.filter(b => getDisplayStatus(b, today) === 'ON').length, [banners, today]);

    // ---------- 폼 ----------
    const openCreate = () => {
        setForm({ ...emptyForm(), adBannerCd: positionFilter !== 'ALL' ? positionFilter : 'MAIN' });
        setSelectedFile(null);
        setFormOpen(true);
    };

    const openEdit = (b: AdBanner) => {
        setForm({
            adBannerNo: b.adBannerNo,
            adBannerCd: b.adBannerCd,
            adBannerNm: b.adBannerNm,
            adBannerLinkUrl: b.adBannerLinkUrl || '',
            linkTargetFg: b.linkTargetFg === 'O' ? 'O' : 'I',
            sortSeq: String(b.sortSeq ?? 1),
            sttDate: toDash(b.sttDate),
            endDate: toDash(b.endDate),
            useYn: b.useYn === 'N' ? 'N' : 'Y',
            bannerStatCd: b.bannerStatCd || DISPLAY_STAT_CD,
            fileUrl: b.fileUrl,
            mimeType: b.mimeType,
        });
        setSelectedFile(null);
        setFormOpen(true);
    };

    const closeForm = () => {
        if (saving) return;
        setFormOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateForm = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            setAlertMessage('이미지 또는 영상 파일만 등록할 수 있습니다.');
            e.target.value = '';
            return;
        }
        const validation = validateFileSize(file);
        if (!validation.isValid) {
            setAlertMessage(validation.message);
            e.target.value = '';
            return;
        }
        setSelectedFile(file);
    };

    /** 화면 입력값 검증 (서버에서도 동일하게 재검증) */
    const validateForm = (): string | null => {
        if (!/^[A-Z0-9_]{1,20}$/.test(form.adBannerCd.trim().toUpperCase())) return '배너 위치코드는 영문 대문자/숫자/_ 20자 이내로 입력해 주세요.';
        if (!form.adBannerNm.trim()) return '배너명을 입력해 주세요.';
        if (form.adBannerNm.trim().length > 400) return '배너명은 400자 이내로 입력해 주세요.';
        if (!form.adBannerNo && !selectedFile) return '배너 이미지 또는 영상을 선택해 주세요.';
        const link = form.adBannerLinkUrl.trim();
        if (link) {
            if (link.length > 400) return '링크 URL은 400자 이내로 입력해 주세요.';
            if (form.linkTargetFg === 'O' && !/^https?:\/\/\S+$/i.test(link)) return '외부 링크는 http:// 또는 https:// 로 시작해야 합니다.';
            if (form.linkTargetFg === 'I' && (!link.startsWith('/') || link.startsWith('//') || /\s/.test(link))) return '내부 화면 링크는 / 로 시작하는 경로로 입력해 주세요. (예: /main/clan)';
        }
        const seq = Number(form.sortSeq);
        if (!Number.isInteger(seq) || seq < 1 || seq > 9999) return '노출 순서는 1 ~ 9999 사이로 입력해 주세요.';
        if (!form.sttDate || !form.endDate) return '노출 기간을 입력해 주세요.';
        if (form.sttDate > form.endDate) return '노출 종료일은 시작일 이후여야 합니다.';
        return null;
    };

    const handleSave = async () => {
        const error = validateForm();
        if (error) {
            setAlertMessage(error);
            return;
        }
        if (!userId) {
            setAlertMessage('로그인 정보가 없습니다.');
            return;
        }

        // 서버 multipart 파트 수 제한(기본 10개)을 넘지 않도록 배너 정보는 JSON 파트 1개로 전송
        const payload = {
            userId,
            adBannerCd: form.adBannerCd.trim().toUpperCase(),
            adBannerNm: form.adBannerNm.trim(),
            adBannerLinkUrl: form.adBannerLinkUrl.trim(),
            linkTargetFg: form.linkTargetFg,
            sortSeq: Number(form.sortSeq),
            sttDate: form.sttDate.replace(/-/g, ''),
            endDate: form.endDate.replace(/-/g, ''),
            useYn: form.useYn,
            bannerStatCd: form.bannerStatCd,
        };
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        if (selectedFile) formData.append('file', selectedFile);

        const isEdit = form.adBannerNo !== null;
        setSaving(true);
        try {
            const res = await fetch(isEdit ? `/api/admin/banners/${form.adBannerNo}` : '/api/admin/banners', {
                method: isEdit ? 'PUT' : 'POST',
                body: formData,
            });
            if (res.ok) {
                setFormOpen(false);
                setSelectedFile(null);
                setAlertMessage(isEdit ? '배너가 수정되었습니다.' : '배너가 등록되었습니다.');
                fetchBanners();
            } else {
                setAlertMessage(await readErrorMessage(res, '저장에 실패했습니다.'));
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('서버와 통신 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // ---------- 오픈 / 중지 ----------
    const requestToggleUse = (b: AdBanner) => {
        const next = b.useYn === 'Y' ? 'N' : 'Y';
        setConfirmState({
            message: next === 'Y'
                ? `[${b.adBannerNm}] 배너를 오픈하시겠습니까?\n노출 기간 내에는 바로 화면에 표시됩니다.`
                : `[${b.adBannerNm}] 배너 노출을 중지하시겠습니까?`,
            onConfirm: () => toggleUse(b, next),
        });
    };

    const toggleUse = async (b: AdBanner, next: 'Y' | 'N') => {
        setConfirmState(null);
        try {
            const res = await fetch(
                `/api/admin/banners/${b.adBannerNo}/use?useYn=${next}&userId=${encodeURIComponent(userId)}`,
                { method: 'PATCH' }
            );
            if (res.ok) {
                setBanners(prev => prev.map(x => (x.adBannerNo === b.adBannerNo ? { ...x, useYn: next } : x)));
            } else {
                setAlertMessage(await readErrorMessage(res, '변경에 실패했습니다.'));
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('서버와 통신 중 오류가 발생했습니다.');
        }
    };

    // 폼 미리보기 대상 (새로 선택한 파일 우선)
    const formMediaUrl = localPreviewUrl || form.fileUrl;
    const formMediaIsVideo = selectedFile ? selectedFile.type.startsWith('video/') : isVideoMedia(form.mimeType, form.fileUrl);

    return (
        <div className="flex flex-col h-full bg-gray-50 font-['Pretendard']" style={{ fontFamily: '"Pretendard", sans-serif' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="text-gray-600 mr-3" aria-label="뒤로가기">
                    <FaChevronLeft size={20} />
                </button>
                <h1 className="top-room-detail-title flex-1">배너 및 광고 관리</h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 bg-[#00BDF8] hover:bg-[#00aadd] text-white text-[13px] font-bold px-3 py-2 rounded-xl shadow-sm transition-colors"
                >
                    <FaPlus size={11} /> 배너 등록
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-2 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-gray-500">
                        전체 <b className="text-gray-800">{banners.length}</b>건 · 노출중 <b className="text-green-600">{onCount}</b>건
                    </span>
                    <select
                        value={positionFilter}
                        onChange={e => setPositionFilter(e.target.value)}
                        className="text-[13px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#00BDF8]"
                    >
                        <option value="ALL">전체 위치</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setStatusFilter(f.key)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${statusFilter === f.key
                                ? 'bg-[#003C48] text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">불러오는 중...</div>
                ) : filteredBanners.length === 0 ? (
                    <div className="text-center py-14 text-gray-400">
                        <p className="text-[14px] font-bold text-gray-500">등록된 배너가 없습니다.</p>
                        <p className="text-[12px] mt-1">우측 상단 [배너 등록]으로 새 배너를 추가해 보세요.</p>
                    </div>
                ) : (
                    filteredBanners.map(b => {
                        const status = getDisplayStatus(b, today);
                        const meta = STATUS_META[status];
                        const isVideo = isVideoMedia(b.mimeType, b.fileUrl);
                        return (
                            <div key={b.adBannerNo} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    <button
                                        onClick={() => b.fileUrl ? setPreview({ url: b.fileUrl, isVideo }) : setAlertMessage('등록된 미디어가 없습니다.')}
                                        className="relative w-24 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100"
                                        aria-label="미리보기"
                                    >
                                        {b.fileUrl ? (
                                            isVideo ? (
                                                <>
                                                    <video src={b.fileUrl} muted preload="metadata" className="w-full h-full object-cover" />
                                                    <FaPlayCircle className="absolute inset-0 m-auto text-white/90 drop-shadow" size={20} />
                                                </>
                                            ) : (
                                                <img src={b.fileUrl} alt={b.adBannerNm} className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <FaImage className="absolute inset-0 m-auto text-gray-300" size={20} />
                                        )}
                                    </button>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${meta.className}`}>{meta.label}</span>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#003C48]/10 text-[#003C48]">{b.adBannerCd}</span>
                                            <span className="text-[11px] text-gray-400">순서 {b.sortSeq}</span>
                                        </div>
                                        <h3 className="text-[15px] font-bold text-gray-900 mt-1 truncate">{b.adBannerNm}</h3>
                                        <p className="text-[12px] text-gray-500 mt-0.5">{toDot(b.sttDate)} ~ {toDot(b.endDate)}</p>
                                        {b.bannerStatCd !== DISPLAY_STAT_CD && (
                                            <p className="text-[11px] text-orange-600 mt-0.5">상태: {statName(b.bannerStatCd)}</p>
                                        )}
                                    </div>

                                    {/* Use toggle */}
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <button
                                            role="switch"
                                            aria-checked={b.useYn === 'Y'}
                                            onClick={() => requestToggleUse(b)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${b.useYn === 'Y' ? 'bg-[#00BDF8]' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${b.useYn === 'Y' ? 'translate-x-5' : ''}`} />
                                        </button>
                                        <span className="text-[10px] text-gray-400">{b.useYn === 'Y' ? '오픈' : '중지'}</span>
                                    </div>
                                </div>

                                {/* Link + actions */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                    <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[12px] text-gray-500">
                                        {b.adBannerLinkUrl ? (
                                            <>
                                                {b.linkTargetFg === 'O' ? <FaExternalLinkAlt size={10} className="shrink-0" /> : <FaLink size={10} className="shrink-0" />}
                                                <span className="shrink-0 font-bold">{b.linkTargetFg === 'O' ? '외부' : '내부'}</span>
                                                <span className="truncate">{b.adBannerLinkUrl}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400">링크 없음</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openEdit(b)}
                                        className="shrink-0 text-[13px] font-bold text-[#00BDF8] border border-[#00BDF8] hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        수정
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 등록/수정 폼 */}
            {formOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeForm}>
                    <div
                        className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-[17px] font-bold text-gray-900">{form.adBannerNo ? '배너 수정' : '배너 등록'}</h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600" aria-label="닫기"><FaTimes size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {/* 미디어 */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
                                    이미지 / 영상 {!form.adBannerNo && <span className="text-red-500">*</span>}
                                </label>
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                                    {formMediaUrl ? (
                                        formMediaIsVideo
                                            ? <video src={formMediaUrl} controls muted className="w-full max-h-48 object-contain bg-black" />
                                            : <img src={formMediaUrl} alt="배너 미리보기" className="w-full max-h-48 object-contain" />
                                    ) : (
                                        <div className="h-28 flex items-center justify-center text-[12px] text-gray-400">등록된 미디어가 없습니다.</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1.5 text-[13px] font-bold text-[#00BDF8] border border-[#00BDF8] px-3 py-1.5 rounded-lg hover:bg-cyan-50"
                                    >
                                        <FaUpload size={11} /> {formMediaUrl ? '파일 변경' : '파일 선택'}
                                    </button>
                                    {selectedFile && (
                                        <span className="text-[12px] text-gray-500 truncate flex-1">{selectedFile.name}</span>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>

                            {/* 위치코드 / 정렬순서 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">위치코드 <span className="text-red-500">*</span></label>
                                    <input
                                        list="banner-position-list"
                                        value={form.adBannerCd}
                                        onChange={e => updateForm('adBannerCd', e.target.value.toUpperCase())}
                                        maxLength={20}
                                        placeholder="MAIN"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    />
                                    <datalist id="banner-position-list">
                                        {positions.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">노출 순서 <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={9999}
                                        value={form.sortSeq}
                                        onChange={e => updateForm('sortSeq', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    />
                                </div>
                            </div>

                            {/* 배너명 */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">배너명 <span className="text-red-500">*</span></label>
                                <input
                                    value={form.adBannerNm}
                                    onChange={e => updateForm('adBannerNm', e.target.value)}
                                    maxLength={400}
                                    placeholder="관리용 배너 이름"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                />
                            </div>

                            {/* 노출기간 */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">노출 기간 <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={form.sttDate}
                                        onChange={e => updateForm('sttDate', e.target.value)}
                                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        min={form.sttDate}
                                        onChange={e => updateForm('endDate', e.target.value)}
                                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                    />
                                </div>
                            </div>

                            {/* 링크 */}
                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">클릭 시 이동</label>
                                <div className="flex gap-2 mb-2">
                                    {([['I', '내부 화면'], ['O', '외부 링크']] as const).map(([v, label]) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => updateForm('linkTargetFg', v)}
                                            className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition-colors ${form.linkTargetFg === v
                                                ? 'border-[#00BDF8] bg-cyan-50 text-[#00BDF8]'
                                                : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    value={form.adBannerLinkUrl}
                                    onChange={e => updateForm('adBannerLinkUrl', e.target.value)}
                                    maxLength={400}
                                    placeholder={form.linkTargetFg === 'I' ? '/main/clan (비워두면 이동 없음)' : 'https://example.com (비워두면 이동 없음)'}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00BDF8]"
                                />
                            </div>

                            {/* 상태 / 사용여부 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">배너 상태</label>
                                    <select
                                        value={form.bannerStatCd}
                                        onChange={e => updateForm('bannerStatCd', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#00BDF8]"
                                    >
                                        {!statCodes.some(c => c.commDtlCd === form.bannerStatCd) && (
                                            <option value={form.bannerStatCd}>{form.bannerStatCd}</option>
                                        )}
                                        {statCodes.map(c => <option key={c.commDtlCd} value={c.commDtlCd}>{c.commDtlNm}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">사용 여부</label>
                                    <div className="flex gap-2">
                                        {([['Y', '오픈'], ['N', '중지']] as const).map(([v, label]) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => updateForm('useYn', v)}
                                                className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition-colors ${form.useYn === v
                                                    ? 'border-[#00BDF8] bg-cyan-50 text-[#00BDF8]'
                                                    : 'border-gray-200 text-gray-500'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                * 사용 여부가 '오픈', 상태가 '{statName(DISPLAY_STAT_CD)}'이고 오늘이 노출 기간 안에 있을 때 화면에 표시됩니다.<br />
                                * 같은 위치에 여러 배너가 있으면 노출 순서가 작은 배너부터 표시됩니다.
                            </p>
                        </div>

                        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
                            <button
                                onClick={closeForm}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-[14px] hover:bg-gray-200 disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-3 rounded-xl bg-[#00BDF8] text-white font-bold text-[14px] hover:bg-[#00aadd] shadow-sm disabled:opacity-60"
                            >
                                {saving ? '저장 중...' : form.adBannerNo ? '수정 저장' : '등록'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert */}
            <CommonModal
                isOpen={!!alertMessage}
                type="alert"
                message={alertMessage}
                onConfirm={() => setAlertMessage('')}
            />

            {/* Confirm (오픈/중지) */}
            <CommonModal
                isOpen={!!confirmState}
                type="confirm"
                message={confirmState?.message}
                onConfirm={() => confirmState?.onConfirm()}
                onCancel={() => setConfirmState(null)}
            />

            {/* Preview */}
            {preview && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/80" onClick={() => setPreview(null)}>
                    <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-10 right-0 text-white font-bold text-xl hover:text-gray-300"
                            onClick={() => setPreview(null)}
                        >
                            ✕ 닫기
                        </button>
                        <div className="bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[200px]">
                            {preview.isVideo ? (
                                <video src={preview.url} controls autoPlay className="w-full max-h-[70vh]" />
                            ) : (
                                <img src={preview.url} alt="배너 미리보기" className="w-full h-auto max-h-[70vh] object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBannerPage;
