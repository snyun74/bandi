/**
 * 주소 기반 근처 지하철역 + 도보 시간 조회 (카카오 Local API 100% 실시간 연동)
 */

export interface SubwayInfo {
    station: string;   // 역 이름 (예: "쌍문역", "창동역")
    minutes: number;   // 도보 예상 소요 시간(분)
    distance?: number; // 거리(m)
}

// 동일 주소 반복 호출 방지용 인메모리 캐시
const cache = new Map<string, SubwayInfo | null>();

/**
 * 주소 문자열로 백엔드 카카오 Local API 프록시를 호출하여 가장 가까운 지하철역 정보를 반환합니다.
 */
export async function getNearbySubway(address: string): Promise<SubwayInfo | null> {
    if (!address || typeof address !== 'string' || !address.trim()) {
        return null;
    }

    const cleanAddress = address.trim();
    if (cache.has(cleanAddress)) {
        return cache.get(cleanAddress)!;
    }

    try {
        const res = await fetch(`/api/studios/subway?address=${encodeURIComponent(cleanAddress)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.station) {
                const info: SubwayInfo = {
                    station: String(data.station),
                    minutes: Number(data.minutes) || 1,
                    distance: data.distance != null ? Number(data.distance) : undefined
                };
                cache.set(cleanAddress, info);
                return info;
            }
        }
    } catch (error) {
        console.error("카카오 지하철역 조회 API 호출 실패:", error);
    }

    cache.set(cleanAddress, null);
    return null;
}
