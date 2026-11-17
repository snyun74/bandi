import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** 노출 배너 (GET /api/admin/banners/display/{위치코드}) */
interface DisplayBanner {
    adBannerNo: number;
    adBannerNm: string;
    fileUrl: string | null;
    mimeType: string | null;
    adBannerLinkUrl: string | null;
    linkTargetFg: 'I' | 'O';
}

interface MainBannerSliderProps {
    /** 배너 위치코드 (기본: MAIN) */
    positionCd?: string;
    /** 이미지 배너 자동 전환 간격(ms) */
    intervalMs?: number;
}

const SWIPE_THRESHOLD = 40;
/** 슬라이드 전환 애니메이션 시간(ms) */
const TRANSITION_MS = 800;
/** 부드럽게 감속하는 전환 곡선 */
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const isVideoBanner = (b: DisplayBanner) =>
    !!b.mimeType?.startsWith('video/') || (!!b.fileUrl && /\.(mp4|webm|ogg|mov)$/i.test(b.fileUrl));

/** 기기의 '동작 줄이기' 설정 여부 */
const prefersReducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * 메인 배너 슬라이더
 * - 노출 대상 배너가 여러 개면 정렬순서대로 자동 전환 (이미지: intervalMs, 영상: 재생 종료 시 다음)
 * - 전환 효과: 방향에 맞춘 슬라이드 + 페이드 + 스케일, 노출 중 천천히 확대(켄 번즈), 진행 바 인디케이터
 * - 마지막 → 처음 전환도 같은 방향으로 자연스럽게 이어짐 (되감기 없음)
 * - 링크: I(내부 화면) → 앱 내 이동, O(외부 링크) → 앱은 외부 브라우저, 웹은 새 창
 */
const MainBannerSlider: React.FC<MainBannerSliderProps> = ({ positionCd = 'MAIN', intervalMs = 2000 }) => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState<DisplayBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [prev, setPrev] = useState<number | null>(null);
    const [direction, setDirection] = useState<1 | -1>(1); // 1: 오른쪽에서 들어옴, -1: 왼쪽에서 들어옴
    const [paused, setPaused] = useState(false);
    const [reducedMotion] = useState(prefersReducedMotion);

    const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
    const touchStartX = useRef<number | null>(null);
    const swiped = useRef(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/admin/banners/display/${encodeURIComponent(positionCd)}`);
                if (res.ok) {
                    const data: DisplayBanner[] = await res.json();
                    if (!cancelled) setBanners(Array.isArray(data) ? data.filter(b => !!b.fileUrl) : []);
                }
            } catch (error) {
                console.error('Failed to fetch main banners', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [positionCd]);

    const count = banners.length;

    /** idx 슬라이드로 이동 (dir: 들어오는 방향) */
    const goTo = useCallback((idx: number, dir: 1 | -1) => {
        if (count <= 1) return;
        const target = ((idx % count) + count) % count;
        if (target === current) return;
        setDirection(dir);
        setPrev(current);
        setCurrent(target);
    }, [count, current]);

    const next = useCallback(() => goTo(current + 1, 1), [goTo, current]);

    // 이미지 배너 자동 전환 (영상은 onEnded 에서 전환)
    useEffect(() => {
        if (count <= 1 || paused) return;
        const banner = banners[current];
        if (!banner || isVideoBanner(banner)) return;
        const timer = window.setTimeout(next, intervalMs);
        return () => window.clearTimeout(timer);
    }, [current, count, paused, banners, intervalMs, next]);

    // 현재 슬라이드의 영상만 재생, 나머지는 정지
    useEffect(() => {
        banners.forEach((b, idx) => {
            const video = videoRefs.current[b.adBannerNo];
            if (!video) return;
            if (idx === current) {
                video.currentTime = 0;
                video.play().catch(() => { /* 자동재생 차단 시 무시 */ });
            } else {
                video.pause();
            }
        });
    }, [current, banners]);

    const openLink = (banner: DisplayBanner) => {
        const url = banner.adBannerLinkUrl?.trim();
        if (!url) return;

        if (banner.linkTargetFg === 'O') {
            // 외부 링크: http(s)만 허용
            if (!/^https?:\/\/\S+$/i.test(url)) return;
            const rnWebView = (window as Window & { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView;
            if (rnWebView) {
                try {
                    rnWebView.postMessage(JSON.stringify({ type: 'OPEN_EXTERNAL_URL', url }));
                    return;
                } catch (e) {
                    console.warn('ReactNativeWebView postMessage failed', e);
                }
            }
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        // 내부 화면: / 로 시작하는 경로만 허용
        if (url.startsWith('/') && !url.startsWith('//')) {
            navigate(url);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        swiped.current = false;
        setPaused(true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current !== null && count > 1) {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                swiped.current = true;
                // 왼쪽으로 밀면 다음(오른쪽에서 들어옴), 오른쪽으로 밀면 이전(왼쪽에서 들어옴)
                if (dx < 0) goTo(current + 1, 1);
                else goTo(current - 1, -1);
            }
        }
        touchStartX.current = null;
        setPaused(false);
    };

    const handleClick = (banner: DisplayBanner) => {
        // 스와이프 동작 직후 발생하는 클릭은 무시
        if (swiped.current) {
            swiped.current = false;
            return;
        }
        openLink(banner);
    };

    /** 슬라이드별 위치/투명도/크기 (현재 / 직전 / 대기) */
    const slideStyle = (idx: number): React.CSSProperties => {
        const transition = reducedMotion
            ? `opacity 300ms linear`
            : `transform ${TRANSITION_MS}ms ${EASING}, opacity ${TRANSITION_MS}ms ${EASING}`;

        if (idx === current) {
            return { transform: 'translateX(0) scale(1)', opacity: 1, zIndex: 2, transition };
        }
        if (idx === prev) {
            // 직전 슬라이드: 들어오는 방향의 반대쪽으로 살짝 밀리며 축소·페이드아웃
            return {
                transform: reducedMotion ? 'none' : `translateX(${-direction * 30}%) scale(0.92)`,
                opacity: 0,
                zIndex: 1,
                transition,
            };
        }
        // 대기 슬라이드: 다음에 들어올 쪽에 미리 위치 (보이지 않음)
        return {
            transform: reducedMotion ? 'none' : `translateX(${direction * 100}%) scale(1)`,
            opacity: 0,
            zIndex: 0,
            transition: 'none',
        };
    };

    /** 노출 중 천천히 확대(켄 번즈) */
    const mediaStyle = (idx: number): React.CSSProperties => {
        if (reducedMotion || count <= 1) return {};
        const active = idx === current;
        return {
            transform: active ? 'scale(1.07)' : 'scale(1)',
            transition: active
                ? `transform ${intervalMs + TRANSITION_MS}ms ease-out`
                : `transform ${TRANSITION_MS}ms ${EASING}`,
        };
    };

    if (loading) {
        return <div className="w-full h-full bg-slate-800 animate-pulse" />;
    }

    if (count === 0) {
        return <img src="/images/main_logo.png" alt="Default Main Banner" className="w-full h-full object-cover" />;
    }

    const currentIsVideo = isVideoBanner(banners[current]);

    return (
        <div
            className="relative w-full h-full overflow-hidden bg-[#003C48]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* 진행 바 애니메이션 */}
            <style>{`@keyframes mainBannerProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>

            {banners.map((b, idx) => {
                const clickable = !!b.adBannerLinkUrl;
                return (
                    <div
                        key={b.adBannerNo}
                        className={`absolute inset-0 overflow-hidden will-change-transform ${clickable ? 'cursor-pointer' : ''}`}
                        style={slideStyle(idx)}
                        onClick={() => idx === current && handleClick(b)}
                        role={clickable ? 'link' : undefined}
                        aria-label={b.adBannerNm}
                        aria-hidden={idx !== current}
                    >
                        <div className="w-full h-full" style={mediaStyle(idx)}>
                            {isVideoBanner(b) ? (
                                <video
                                    ref={el => { videoRefs.current[b.adBannerNo] = el; }}
                                    src={b.fileUrl!}
                                    muted
                                    playsInline
                                    autoPlay={idx === current}
                                    loop={count === 1}
                                    onEnded={() => { if (count > 1 && idx === current) next(); }}
                                    onError={() => { if (count > 1 && idx === current) window.setTimeout(next, intervalMs); }}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={b.fileUrl!}
                                    alt={b.adBannerNm}
                                    draggable={false}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {/* 하단 그라데이션 (인디케이터 가독성) */}
            {count > 1 && (
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" style={{ zIndex: 3 }} />
            )}

            {/* 인디케이터: 현재 배너는 진행 바로 표시 */}
            {count > 1 && (
                <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none" style={{ zIndex: 4 }}>
                    {banners.map((b, idx) => {
                        const active = idx === current;
                        return (
                            <span
                                key={b.adBannerNo}
                                className="relative h-1.5 rounded-full overflow-hidden bg-white/45"
                                style={{
                                    width: active ? 22 : 6,
                                    transition: reducedMotion ? 'none' : `width 400ms ${EASING}`,
                                }}
                            >
                                {active && (
                                    <span
                                        // 일시정지 해제 시 타이머와 함께 처음부터 다시 채움
                                        key={`${current}-${paused}`}
                                        className="absolute inset-0 bg-white rounded-full origin-left"
                                        style={
                                            paused || currentIsVideo || reducedMotion
                                                ? { transform: 'scaleX(1)' }
                                                : { animation: `mainBannerProgress ${intervalMs}ms linear forwards` }
                                        }
                                    />
                                )}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MainBannerSlider;
