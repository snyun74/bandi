import React, { useState, useEffect, useRef } from 'react';
import { FaMusic, FaMapMarkerAlt, FaCalendarAlt, FaPen, FaEye, FaMagic } from 'react-icons/fa';

export interface TemplateState {
    genres: string[];
    region: string;
    customRegion: string;
    schedule: string;
    freeIntro: string;
}

// 4열 그리드에 맞춰 간결한 명칭으로 정돈
export const GENRE_OPTIONS = [
    '락/메탈',
    '팝/어쿠스틱',
    '인디',
    '재즈/블루스',
    'J-POP/애니',
    '가요/발라드',
    'R&B/소울',
    '올장르/자유',
];

// 3열 그리드에 맞춰 간결한 명칭으로 정돈
export const REGION_OPTIONS = [
    '서울 홍대/합정',
    '서울 강남/사당',
    '서울 건대/성수',
    '서울 신촌/종로',
    '경기 북부',
    '경기 남부',
    '인천',
    '지방/온라인',
    '직접 입력',
];

// 2열 그리드에 맞춰 균등 배치
export const SCHEDULE_OPTIONS = [
    '주 1회 (주말)',
    '주 1회 (평일 저녁)',
    '격주 1회 (주말)',
    '월 1~2회',
    '공연 전 집중 합주',
    '일정 상호 조율',
];

/**
 * 템플릿 상태를 문자열로 빌드 (모집 파트 제외하고 핵심만)
 */
export const buildClanIntroText = (data: TemplateState): string => {
    const parts: string[] = [];

    const effectiveRegion = data.region === '직접 입력' 
        ? data.customRegion.trim() 
        : data.region;

    if (data.genres.length > 0) {
        parts.push(`🎵 [장르] ${data.genres.join(', ')}`);
    }
    if (effectiveRegion) {
        parts.push(`📍 [지역] ${effectiveRegion}`);
    }
    if (data.schedule) {
        parts.push(`📅 [일정] ${data.schedule}`);
    }

    const freeText = data.freeIntro.trim();
    if (freeText) {
        if (parts.length > 0) {
            parts.push(`\n[소개 및 안내]\n${freeText}`);
        } else {
            parts.push(freeText);
        }
    }

    return parts.join('\n');
};

/**
 * 기존 문자열을 파싱하여 템플릿 상태로 복원 (역파싱)
 */
export const parseClanIntroText = (rawText: string): { template: TemplateState; isTemplateMatched: boolean } => {
    const emptyState: TemplateState = {
        genres: [],
        region: '',
        customRegion: '',
        schedule: '',
        freeIntro: '',
    };

    if (!rawText || !rawText.trim()) {
        return { template: emptyState, isTemplateMatched: false };
    }

    const lines = rawText.split('\n');
    const template: TemplateState = { ...emptyState };

    let isTemplateMatched = false;
    const freeIntroLines: string[] = [];
    let isFreeIntroSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('[소개 및 안내]')) {
            isFreeIntroSection = true;
            isTemplateMatched = true;
            continue;
        }

        if (isFreeIntroSection) {
            freeIntroLines.push(lines[i]);
            continue;
        }

        // 장르 패턴 매칭: 🎵 [장르] or 🎸 [장르] or [장르] or • 장르
        const genreMatch = line.match(/(?:[🎵🎸🎶]\s*)?\[?장르\]?[:\s]+(.+)/i);
        if (genreMatch) {
            const rawGenres = genreMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            template.genres = rawGenres;
            isTemplateMatched = true;
            continue;
        }

        // 지역 패턴 매칭: 📍 [지역] 서울 홍대/합정 or [지역] 서울 or • 지역: ...
        const regionMatch = line.match(/(?:[📍🗺️]\s*)?\[?지역\]?[:\s]+(.+)/i);
        if (regionMatch) {
            const parsedRegion = regionMatch[1].trim();
            if (REGION_OPTIONS.includes(parsedRegion) && parsedRegion !== '직접 입력') {
                template.region = parsedRegion;
            } else {
                template.region = '직접 입력';
                template.customRegion = parsedRegion;
            }
            isTemplateMatched = true;
            continue;
        }

        // 일정 패턴 매칭: 📅 [일정] or ⏰ [일정] or [일정] or [주기]
        const scheduleMatch = line.match(/(?:[📅⏰🗓️]\s*)?\[?(?:일정|주기|합주 일정)\]?[:\s]+(.+)/i);
        if (scheduleMatch) {
            template.schedule = scheduleMatch[1].trim();
            isTemplateMatched = true;
            continue;
        }

        // 혹시 기존에 남아있던 [모집] 라인이 있다면 자유 라인으로 넘겨서 유실 방지
        if (line.match(/(?:🥁\s*)?\[?(?:모집|모집 파트)\]?[:\s]+(.+)/i)) {
            freeIntroLines.push(lines[i]);
            continue;
        }

        // 그 외 매칭되지 않는 줄은 자유 소개 라인으로 축적
        if (line) {
            freeIntroLines.push(lines[i]);
        }
    }

    template.freeIntro = freeIntroLines.join('\n').trim();

    return {
        template,
        isTemplateMatched,
    };
};

/**
 * 클랜 헤더/목록용 간략 소개글 추출
 * - 템플릿 태그([장르], [지역], [일정])를 제외하고, 사용자가 직접 작성한 순수 한마디/소개글만 깔끔하게 추출합니다.
 */
export const getDisplayIntroSummary = (rawText?: string | null): string => {
    if (!rawText || !rawText.trim()) return '';

    const parsed = parseClanIntroText(rawText);
    if (!parsed.isTemplateMatched) {
        // 일반 소개글인 경우 그대로 반환
        return rawText.trim();
    }

    // 템플릿인 경우: 템플릿 태그를 제외하고 사용자가 직접 작성한 한마디(freeIntro)만 반환
    if (parsed.template.freeIntro && parsed.template.freeIntro.trim()) {
        return parsed.template.freeIntro.trim();
    }

    return '';
};

/**
 * 클랜 소개글이 필수 규칙을 만족하는지 검증
 * - 템플릿 사용 시: 템플릿 태그([장르], [지역], [일정]) 외에 클랜 소개 한마디(freeIntro)가 반드시 입력되어야 함
 * - 직접 입력 시: 소개글 전체가 비어있지 않아야 함
 */
export const validateClanIntro = (rawText?: string | null): { isValid: boolean; message?: string } => {
    if (!rawText || !rawText.trim()) {
        return { isValid: false, message: '클랜 소개를 입력해주세요.' };
    }
    const parsed = parseClanIntroText(rawText);
    if (parsed.isTemplateMatched) {
        if (!parsed.template.freeIntro || !parsed.template.freeIntro.trim()) {
            return { isValid: false, message: '클랜 소개 한마디를 입력해주세요.' };
        }
    }
    return { isValid: true };
};

interface ClanIntroTemplateEditorProps {
    value: string;
    onChange: (text: string) => void;
    label?: string;
    required?: boolean;
}

export const ClanIntroTemplateEditor: React.FC<ClanIntroTemplateEditorProps> = ({
    value,
    onChange,
    label = '클랜 소개',
    required = false,
}) => {
    // 탭 모드: 'template' (템플릿 선택) vs 'direct' (직접 텍스트 편집)
    const [mode, setMode] = useState<'template' | 'direct'>('template');
    
    // 내부 템플릿 상태
    const [templateState, setTemplateState] = useState<TemplateState>(() => {
        const parsed = parseClanIntroText(value);
        return parsed.template;
    });

    const isInternalUpdate = useRef(false);

    // 외부에서 value가 직접 바뀔 때 (초기 로딩 등) 템플릿 상태 동기화
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const parsed = parseClanIntroText(value);
        setTemplateState(parsed.template);
        if (value && value.trim() && !parsed.isTemplateMatched) {
            setMode('direct');
        }
    }, [value]);

    // 템플릿 상태 변경 시 부모 value 업데이트
    const updateTemplate = (updater: (prev: TemplateState) => TemplateState) => {
        setTemplateState(prev => {
            const next = updater(prev);
            const combinedText = buildClanIntroText(next);
            isInternalUpdate.current = true;
            onChange(combinedText);
            return next;
        });
    };

    // 장르 다중 선택 토글
    const handleToggleGenre = (genre: string) => {
        updateTemplate(prev => {
            const exists = prev.genres.includes(genre);
            const newGenres = exists 
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre];
            return { ...prev, genres: newGenres };
        });
    };

    // 지역 단일 선택 토글
    const handleSelectRegion = (region: string) => {
        updateTemplate(prev => {
            const isSame = prev.region === region;
            return {
                ...prev,
                region: isSame ? '' : region,
                customRegion: isSame ? '' : prev.customRegion,
            };
        });
    };

    // 합주 주기 단일 선택 토글
    const handleSelectSchedule = (schedule: string) => {
        updateTemplate(prev => ({
            ...prev,
            schedule: prev.schedule === schedule ? '' : schedule,
        }));
    };

    // 탭 전환 핸들러
    const handleSwitchMode = (newMode: 'template' | 'direct') => {
        if (newMode === 'template') {
            const parsed = parseClanIntroText(value);
            setTemplateState(parsed.template);
        }
        setMode(newMode);
    };

    return (
        <div className="space-y-2">
            {/* 상단 레이블 & 모드 전환 탭 */}
            <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-[#003C48]">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                        type="button"
                        onClick={() => handleSwitchMode('template')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                            mode === 'template'
                                ? 'bg-white text-[#00BDF8] shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <FaMagic size={10} />
                        <span>간편 템플릿</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSwitchMode('direct')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                            mode === 'direct'
                                ? 'bg-white text-[#00BDF8] shadow-xs'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <FaPen size={10} />
                        <span>직접 입력</span>
                    </button>
                </div>
            </div>

            {/* 1. 템플릿 모드 (규격화된 깔끔한 카드 & 그리드 레이아웃) */}
            {mode === 'template' ? (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 space-y-3">
                    
                    {/* (1) 장르 - 4열 정렬 */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <FaMusic className="text-[#00BDF8]" size={11} />
                                <span>음악 장르</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">다중 선택 가능</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {GENRE_OPTIONS.map((genre) => {
                                const selected = templateState.genres.includes(genre);
                                return (
                                    <button
                                        type="button"
                                        key={genre}
                                        onClick={() => handleToggleGenre(genre)}
                                        className={`py-1.5 px-1 rounded-lg text-[11px] text-center font-medium transition-all active:scale-95 truncate ${
                                            selected
                                                ? 'bg-[#00BDF8] text-white font-bold shadow-xs'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                                        }`}
                                        title={genre}
                                    >
                                        {genre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* (2) 활동 지역 - 3열 정렬 */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <FaMapMarkerAlt className="text-rose-500" size={11} />
                                <span>주요 활동 지역</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">1개 선택</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {REGION_OPTIONS.map((region) => {
                                const selected = templateState.region === region;
                                return (
                                    <button
                                        type="button"
                                        key={region}
                                        onClick={() => handleSelectRegion(region)}
                                        className={`py-1.5 px-1 rounded-lg text-[11px] text-center font-medium transition-all active:scale-95 truncate ${
                                            selected
                                                ? 'bg-rose-500 text-white font-bold shadow-xs'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                                        }`}
                                        title={region}
                                    >
                                        {region}
                                    </button>
                                );
                            })}
                        </div>
                        {templateState.region === '직접 입력' && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={templateState.customRegion}
                                    onChange={(e) => updateTemplate(prev => ({ ...prev, customRegion: e.target.value }))}
                                    placeholder="활동 지역을 입력하세요 (예: 대전 둔산동)"
                                    className="w-full bg-slate-50 border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-rose-500 animate-fade-in"
                                />
                            </div>
                        )}
                    </div>

                    {/* (3) 정기 합주 주기 - 2열 정렬 */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <FaCalendarAlt className="text-amber-500" size={11} />
                                <span>정기 합주 주기</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">1개 선택</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {SCHEDULE_OPTIONS.map((sch) => {
                                const selected = templateState.schedule === sch;
                                return (
                                    <button
                                        type="button"
                                        key={sch}
                                        onClick={() => handleSelectSchedule(sch)}
                                        className={`py-1.5 px-2 rounded-lg text-[11px] text-center font-medium transition-all active:scale-95 truncate ${
                                            selected
                                                ? 'bg-amber-500 text-white font-bold shadow-xs'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                                        }`}
                                        title={sch}
                                    >
                                        {sch}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* (4) 클랜 한마디 / 소개 (필수 입력) */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <FaPen className="text-[#00BDF8]" size={10} />
                                <span>클랜 소개 한마디 <span className="text-red-500">*</span></span>
                            </div>
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200/60">
                                필수 입력
                            </span>
                        </div>
                        <textarea
                            value={templateState.freeIntro}
                            onChange={(e) => updateTemplate(prev => ({ ...prev, freeIntro: e.target.value }))}
                            placeholder="예: 초보자도 환영하며, 연말 라이브 공연을 목표로 신나게 합주할 분들을 환영합니다! (필수 입력)"
                            className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors h-16 resize-none leading-relaxed text-slate-700 ${
                                !templateState.freeIntro.trim() && (templateState.genres.length > 0 || templateState.region || templateState.schedule)
                                    ? 'border-amber-300 focus:border-amber-500'
                                    : 'border-slate-200 focus:border-[#00BDF8]'
                            }`}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            * 클랜을 소개하는 한마디를 필수로 작성해주세요.
                        </p>
                    </div>

                    {/* (5) 실시간 조합 미리보기 (작성된 내용이 있을 때만 단정하게 표시) */}
                    {value.trim() && (
                        <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 shadow-2xs">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-sky-800 mb-1">
                                <FaEye size={10} />
                                <span>완성된 소개글 미리보기</span>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-sky-100/70 font-sans">
                                {value}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* 2. 직접 텍스트 편집 모드 */
                <div className="space-y-1">
                    <textarea
                        value={value}
                        onChange={(e) => {
                            isInternalUpdate.current = true;
                            onChange(e.target.value);
                        }}
                        placeholder="클랜 소개글을 자유롭게 작성하세요."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#00BDF8] transition-colors h-40 resize-none leading-relaxed"
                    />
                    <p className="text-[11px] text-gray-400 ml-1">
                        * 언제든 상단의 [간편 템플릿] 버튼을 눌러 정돈된 선택 모드로 돌아갈 수 있습니다.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClanIntroTemplateEditor;
