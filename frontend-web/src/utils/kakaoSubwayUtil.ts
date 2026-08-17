/**
 * 주소 기반 근처 지하철역 + 도보 시간 조회
 *
 * 1차: 백엔드 프록시를 통해 카카오 Local API 조회 시도
 *      (카카오 앱에서 "지도/로컬" 서비스 활성화 필요)
 * 2차: 카카오 API 실패 시 내장 키워드 룩업 테이블로 폴백
 */

export interface SubwayInfo {
    station: string;  // 역 이름 (예: "태릉입구역")
    minutes: number;  // 도보 예상 소요 시간(분)
    distance?: number; // 직선 거리(m) - 카카오 API 조회 시만 포함
}

// ───────────────────────────────────────────────────
// 내장 키워드 룩업 테이블 (카카오 API 비활성 시 폴백)
// ───────────────────────────────────────────────────
const SUBWAY_LOOKUP: { keywords: string[]; station: string; minutes: number }[] = [
    // 홍대/마포 권역
    { keywords: ['서교동', '홍대'], station: '홍대입구역', minutes: 5 },
    { keywords: ['동교동'], station: '홍대입구역', minutes: 8 },
    { keywords: ['합정동', '합정'], station: '합정역', minutes: 4 },
    { keywords: ['상수동', '상수'], station: '상수역', minutes: 3 },
    { keywords: ['연남동'], station: '홍대입구역', minutes: 10 },
    { keywords: ['망원동', '망원'], station: '망원역', minutes: 5 },
    // 강남 권역
    { keywords: ['역삼동', '역삼'], station: '역삼역', minutes: 4 },
    { keywords: ['강남대로', '강남구청'], station: '강남역', minutes: 5 },
    { keywords: ['논현동', '논현'], station: '논현역', minutes: 5 },
    { keywords: ['청담동', '청담'], station: '청담역', minutes: 6 },
    { keywords: ['삼성동', '삼성'], station: '삼성역', minutes: 5 },
    { keywords: ['선릉동', '선릉'], station: '선릉역', minutes: 4 },
    { keywords: ['대치동', '대치'], station: '대치역', minutes: 6 },
    // 신촌/이대 권역
    { keywords: ['신촌동', '신촌'], station: '신촌역', minutes: 4 },
    { keywords: ['대현동', '이대'], station: '이대역', minutes: 5 },
    // 건대/성수 권역
    { keywords: ['화양동', '건대'], station: '건대입구역', minutes: 5 },
    { keywords: ['성수동', '성수', '강변북로'], station: '성수역', minutes: 6 },
    // 이태원/용산 권역
    { keywords: ['이태원동', '이태원'], station: '이태원역', minutes: 4 },
    { keywords: ['한남동', '한남'], station: '한강진역', minutes: 7 },
    { keywords: ['용산동', '용산'], station: '용산역', minutes: 5 },
    // 종로/을지로 권역
    { keywords: ['종로', '관철동', '인사동'], station: '종각역', minutes: 5 },
    { keywords: ['을지로', '명동'], station: '을지로입구역', minutes: 4 },
    // 신림/관악 권역
    { keywords: ['신림동', '신림'], station: '신림역', minutes: 5 },
    { keywords: ['봉천동', '봉천'], station: '봉천역', minutes: 5 },
    // 노원/도봉 권역
    { keywords: ['노원동', '노원구', '노원'], station: '노원역', minutes: 5 },
    { keywords: ['공릉동', '공릉로', '공릉'], station: '태릉입구역', minutes: 5 },
    { keywords: ['중계동', '중계'], station: '노원역', minutes: 7 },
    { keywords: ['쌍문동', '쌍문'], station: '쌍문역', minutes: 4 },
    { keywords: ['도봉동', '도봉'], station: '도봉역', minutes: 5 },
    { keywords: ['방학동', '방학'], station: '방학역', minutes: 5 },
    { keywords: ['해등로', '창동'], station: '창동역', minutes: 6 },
    // 성동/광진 권역
    { keywords: ['성동구', '왕십리'], station: '왕십리역', minutes: 5 },
    // 마포 권역
    { keywords: ['마포구', '마포', '성미산로'], station: '마포역', minutes: 7 },
    // 부산 권역
    { keywords: ['서면동', '서면'], station: '서면역', minutes: 4 },
    { keywords: ['해운대동', '해운대'], station: '해운대역', minutes: 6 },
    { keywords: ['남포동', '남포'], station: '남포역', minutes: 5 },
    // 기타 주요 권역
    { keywords: ['수원', '팔달구', '영통구'], station: '수원역', minutes: 8 },
    { keywords: ['인천', '부평'], station: '부평역', minutes: 6 },
    { keywords: ['대구', '동성로'], station: '반월당역', minutes: 5 },
];

function lookupByKeyword(address: string): SubwayInfo | null {
    const matched = SUBWAY_LOOKUP.find(entry =>
        entry.keywords.some(kw => address.includes(kw))
    );
    return matched ? { station: matched.station, minutes: matched.minutes } : null;
}

// ───────────────────────────────────────────────────
// 캐시
// ───────────────────────────────────────────────────
const cache = new Map<string, SubwayInfo | null>();

// 카카오 Local API 활성화 여부 (한 번 실패하면 이후 호출 스킵)
let kakaoApiAvailable = true;

/**
 * 주소 문자열로 근처 지하철역 정보 반환
 * @returns SubwayInfo | null (500m 이내 역이 없으면 null)
 */
export async function getNearbySubway(address: string): Promise<SubwayInfo | null> {
    if (!address) return null;

    if (cache.has(address)) return cache.get(address)!;

    // ── 1차: 카카오 API (백엔드 프록시) ──
    if (kakaoApiAvailable) {
        try {
            const res = await fetch(`/api/studios/subway?address=${encodeURIComponent(address)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.station) {
                    const info: SubwayInfo = { station: data.station, minutes: data.minutes, distance: data.distance };
                    cache.set(address, info);
                    return info;
                }
                // 빈 객체 = 500m 내 역 없음 (API 자체는 성공)
                // → 키워드 폴백 시도
            } else {
                kakaoApiAvailable = false; // API 비활성 → 이후 요청 스킵
            }
        } catch {
            kakaoApiAvailable = false;
        }
    }

    // ── 2차: 내장 키워드 룩업 폴백 ──
    const fallback = lookupByKeyword(address);
    cache.set(address, fallback);
    return fallback;
}
