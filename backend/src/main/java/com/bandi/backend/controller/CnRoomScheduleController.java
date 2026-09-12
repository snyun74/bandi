package com.bandi.backend.controller;

import com.bandi.backend.dto.CnRoomScheduleDto;
import com.bandi.backend.dto.EligibleClanJamDto;
import com.bandi.backend.service.CnRoomScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clan/{clanId}/room-schedules")
@RequiredArgsConstructor
@Slf4j
public class CnRoomScheduleController {

    private final CnRoomScheduleService cnRoomScheduleService;

    /**
     * 기간별 동아리방 예약 스케쥴 조회
     */
    @GetMapping
    public ResponseEntity<List<CnRoomScheduleDto>> getRoomSchedules(
            @PathVariable("clanId") Long clanId,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "userId", required = false) String userId) {
        List<CnRoomScheduleDto> schedules = cnRoomScheduleService.getRoomSchedules(clanId, startDate, endDate, userId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * 예약 가능한 내 합주방 목록 조회 (진행/확정 상태 합주방의 멤버)
     */
    @GetMapping("/eligible-jams")
    public ResponseEntity<List<EligibleClanJamDto>> getEligibleJams(
            @PathVariable("clanId") Long clanId,
            @RequestParam("userId") String userId) {
        List<EligibleClanJamDto> jams = cnRoomScheduleService.getEligibleJams(clanId, userId);
        return ResponseEntity.ok(jams);
    }

    /**
     * 동아리방 예약 등록 (저장 시점 중복 체크 포함)
     */
    @PostMapping
    public ResponseEntity<?> createRoomSchedule(
            @PathVariable("clanId") Long clanId,
            @RequestBody CnRoomScheduleDto dto,
            @RequestParam(value = "userId", required = false) String userIdParam) {
        try {
            String userId = dto.getInsId() != null && !dto.getInsId().trim().isEmpty() ? dto.getInsId() : userIdParam;
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "로그인 사용자 정보가 필요합니다."));
            }
            dto.setCnNo(clanId);
            CnRoomScheduleDto created = cnRoomScheduleService.createSchedule(dto, userId);
            return ResponseEntity.ok(created);
        } catch (IllegalStateException e) {
            log.warn("동아리방 예약 중복 충돌: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("동아리방 예약 입력 오류: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("동아리방 예약 등록 중 예외 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "예약 처리 중 오류가 발생했습니다."));
        }
    }

    /**
     * 동아리방 예약 삭제 (현재 시점 이후 예약만 가능)
     */
    @DeleteMapping("/{cnSchNo}")
    public ResponseEntity<?> deleteRoomSchedule(
            @PathVariable("clanId") Long clanId,
            @PathVariable("cnSchNo") Long cnSchNo,
            @RequestParam("userId") String userId) {
        try {
            cnRoomScheduleService.deleteSchedule(cnSchNo, userId);
            return ResponseEntity.ok(Map.of("message", "동아리방 예약이 취소되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("동아리방 예약 삭제 중 예외 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "예약 삭제 처리 중 오류가 발생했습니다."));
        }
    }
}
