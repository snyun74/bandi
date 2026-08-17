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

@RestController
@RequestMapping("/api/studios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudioController {

    private final PartnerService partnerService;

    @Value("${kakao.client-id}")
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
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Step 1: 주소 → 좌표
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);
            String geoUrl = "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodedAddress;

            ResponseEntity<Map> geoResponse = restTemplate.exchange(geoUrl, HttpMethod.GET, entity, Map.class);
            Map geoBody = geoResponse.getBody();
            if (geoBody == null) return ResponseEntity.ok(Map.of());

            List<Map<String, Object>> docs = (List<Map<String, Object>>) geoBody.get("documents");
            if (docs == null || docs.isEmpty()) return ResponseEntity.ok(Map.of());

            String lat = String.valueOf(docs.get(0).get("y"));
            String lng = String.valueOf(docs.get(0).get("x"));

            // Step 2: 좌표 → 반경 500m 이내 지하철역 (카테고리 코드 SW8)
            String subwayUrl = "https://dapi.kakao.com/v2/local/search/category.json"
                    + "?category_group_code=SW8&x=" + lng + "&y=" + lat + "&radius=500&sort=distance";

            ResponseEntity<Map> subwayResponse = restTemplate.exchange(subwayUrl, HttpMethod.GET, entity, Map.class);
            Map subwayBody = subwayResponse.getBody();
            if (subwayBody == null) return ResponseEntity.ok(Map.of());

            List<Map<String, Object>> stations = (List<Map<String, Object>>) subwayBody.get("documents");
            if (stations == null || stations.isEmpty()) return ResponseEntity.ok(Map.of());

            Map<String, Object> nearest = stations.get(0);
            int distanceM = Integer.parseInt(String.valueOf(nearest.get("distance")));
            int minutes = Math.max(1, (int) Math.ceil(distanceM / 80.0));

            Map<String, Object> result = new HashMap<>();
            result.put("station", nearest.get("place_name"));
            result.put("minutes", minutes);
            result.put("distance", distanceM);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
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
            String actualUserId = userId != null ? userId : (reservation.getUserId() != null ? reservation.getUserId() : "anonymous");
            com.bandi.backend.entity.band.BnReservation created = partnerService.createReservation(reservation, actualUserId);
            return ResponseEntity.ok(created);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "예약 처리 중 오류가 발생했습니다."));
        }
    }
}
