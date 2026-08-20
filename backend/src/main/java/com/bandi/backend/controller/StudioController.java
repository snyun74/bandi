package com.bandi.backend.controller;

import com.bandi.backend.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/studios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudioController {

    private final PartnerService partnerService;

    @Value("${kakao.client-id:b7b74bba84f701122fa1bacf9697f578}")
    private String kakaoRestApiKey;

    @GetMapping("/active")
    public ResponseEntity<List<PartnerService.StudioDto>> getActiveStudios() {
        return ResponseEntity.ok(partnerService.getActiveStudiosWithDetails());
    }

    @GetMapping("/{studioNo}")
    public ResponseEntity<PartnerService.StudioDetailDto> getStudioDetail(@PathVariable Long studioNo) {
        PartnerService.StudioDetailDto detail = partnerService.getStudioDetail(studioNo);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detail);
    }

    /**
     * 카카오 Local API 프록시 - 주소 기반 근처 지하철역 조회
     * 브라우저에서 직접 호출 시 도메인 제한으로 403 발생하므로 서버에서 대신 호출
     */
    @SuppressWarnings("unchecked")
    @GetMapping("/subway")
    public ResponseEntity<Map<String, Object>> getNearbySubway(@RequestParam String address) {
        log.info("Subway lookup request for address: {}", address);
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String lat = null;
            String lng = null;

            // Step 1: 원본 주소부터 상세주소 토큰을 뒤에서부터 하나씩 제거하며 주소 검색 (예: "서울 도봉구 해등로 21 301-605" -> "서울 도봉구 해등로 21")
            String[] tokens = address.trim().split("\\s+");
            for (int len = tokens.length; len >= 2; len--) {
                String candidate = String.join(" ", java.util.Arrays.copyOfRange(tokens, 0, len));
                String enc = URLEncoder.encode(candidate, StandardCharsets.UTF_8).replace("+", "%20");
                try {
                    java.net.URI geoUri = java.net.URI.create("https://dapi.kakao.com/v2/local/search/address.json?query=" + enc);
                    ResponseEntity<Map> geoResponse = restTemplate.exchange(geoUri, HttpMethod.GET, entity, Map.class);
                    Map geoBody = geoResponse.getBody();
                    List<Map<String, Object>> docs = geoBody != null ? (List<Map<String, Object>>) geoBody.get("documents") : null;
                    if (docs != null && !docs.isEmpty()) {
                        lat = String.valueOf(docs.get(0).get("y"));
                        lng = String.valueOf(docs.get(0).get("x"));
                        log.info("Found coords by address candidate '{}': lat={}, lng={}", candidate, lat, lng);
                        break;
                    }
                } catch (Exception e) {
                    log.warn("Address search error for candidate '{}': {}", candidate, e.getMessage());
                }
            }

            // Step 1-Fallback: 주소 검색으로 안 나오는 특수 건물명의 경우 키워드 검색으로 재시도
            if (lat == null || lng == null) {
                String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8).replace("+", "%20");
                try {
                    java.net.URI keywordUri = java.net.URI.create("https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodedAddress);
                    ResponseEntity<Map> kwResponse = restTemplate.exchange(keywordUri, HttpMethod.GET, entity, Map.class);
                    Map kwBody = kwResponse.getBody();
                    List<Map<String, Object>> kwDocs = kwBody != null ? (List<Map<String, Object>>) kwBody.get("documents") : null;
                    if (kwDocs != null && !kwDocs.isEmpty()) {
                        lat = String.valueOf(kwDocs.get(0).get("y"));
                        lng = String.valueOf(kwDocs.get(0).get("x"));
                        log.info("Found coords by keyword fallback: lat={}, lng={}", lat, lng);
                    }
                } catch (Exception e) {
                    log.warn("Keyword search error for address '{}': {}", address, e.getMessage());
                }
            }

            if (lat == null || lng == null) {
                log.warn("No coordinates found for address: {}", address);
                return ResponseEntity.ok(Map.of());
            }

            // Step 2: 좌표 → 반경 5km(5000m) 이내 가장 가까운 지하철역 검색 (카테고리 코드 SW8, 최단거리순 정렬)
            java.net.URI subwayUri = java.net.URI.create("https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SW8&x="
                    + lng + "&y=" + lat + "&radius=5000&sort=distance");

            ResponseEntity<Map> subwayResponse = restTemplate.exchange(subwayUri, HttpMethod.GET, entity, Map.class);
            Map subwayBody = subwayResponse.getBody();
            if (subwayBody == null) return ResponseEntity.ok(Map.of());

            List<Map<String, Object>> stations = (List<Map<String, Object>>) subwayBody.get("documents");
            if (stations == null || stations.isEmpty()) {
                log.warn("No subway stations found near lat={}, lng={}", lat, lng);
                return ResponseEntity.ok(Map.of());
            }

            // 1순위 가장 가까운 지하철역
            Map<String, Object> nearest = stations.get(0);
            int distanceM = Integer.parseInt(String.valueOf(nearest.get("distance")));
            int minutes = Math.max(1, (int) Math.round(distanceM / 67.0)); // 분당 약 67m (성인 평균 보행 속도 4km/h 기준)

            Map<String, Object> result = new HashMap<>();
            result.put("station", nearest.get("place_name"));
            result.put("minutes", minutes);
            result.put("distance", distanceM);
            log.info("Subway lookup success: station={}, distance={}m, minutes={}", nearest.get("place_name"), distanceM, minutes);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Subway lookup failed with error for address {}: ", address, e);
            return ResponseEntity.ok(Map.of());
        }
    }

    /**
     * 특정 룸의 월별 스케줄 및 예약 현황 조회
     */
    @GetMapping("/rooms/{roomNo}/schedule")
    public ResponseEntity<PartnerService.RoomScheduleDto> getRoomSchedule(
            @PathVariable Long roomNo,
            @RequestParam(value = "yearMonth", required = false) String yearMonth) {
        PartnerService.RoomScheduleDto schedule = partnerService.getRoomSchedule(roomNo, yearMonth);
        if (schedule == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(schedule);
    }

    /**
     * 사용자 룸 예약 생성
     */
    @PostMapping("/rooms/{roomNo}/reservations")
    public ResponseEntity<?> createReservation(
            @PathVariable Long roomNo,
            @RequestParam(value = "userId", required = false) String userId,
            @RequestBody com.bandi.backend.entity.band.BnReservation reservation) {
        try {
            reservation.setRoomNo(roomNo);
            String actualUserId = userId != null ? userId
                    : (reservation.getUserId() != null ? reservation.getUserId() : "anonymous");
            com.bandi.backend.entity.band.BnReservation created = partnerService.createReservation(reservation,
                    actualUserId);
            return ResponseEntity.ok(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "예약 처리 중 오류가 발생했습니다."));
        }
    }
}
