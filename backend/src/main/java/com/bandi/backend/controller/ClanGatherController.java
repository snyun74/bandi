package com.bandi.backend.controller;

import com.bandi.backend.dto.ClanGatherApplyDto;
import com.bandi.backend.dto.ClanGatherCreateDto;
import com.bandi.backend.dto.ClanGatherResponseDto;
import com.bandi.backend.service.ClanGatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.bandi.backend.dto.GatheringMatchResultDto;
import com.bandi.backend.dto.MatchSwapRequestDto;

@RestController
@RequestMapping("/api/clans/gatherings")
@RequiredArgsConstructor
public class ClanGatherController {

    private final ClanGatherService clanGatherService;

    @PostMapping
    public ResponseEntity<?> createGathering(@RequestBody ClanGatherCreateDto dto) {
        try {
            Long gatherNo = clanGatherService.createGathering(dto);
            return ResponseEntity.ok(Map.of("message", "합주 모집 공고가 등록되었습니다.", "gatherNo", gatherNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "합주 공고 등록에 실패했습니다."));
        }
    }

    @GetMapping("/clan/{clanId}")
    public ResponseEntity<?> getActiveGatherings(@PathVariable Long clanId,
            @RequestParam(required = false) String userId) {
        try {
            List<ClanGatherResponseDto> gatherings = clanGatherService.getActiveGatherings(clanId, userId);
            return ResponseEntity.ok(gatherings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch gatherings", "error", e.getMessage()));
        }
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyForGathering(@RequestBody ClanGatherApplyDto dto) {
        try {
            clanGatherService.applyForGathering(dto);
            return ResponseEntity.ok(Map.of("message", "신청이 완료되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "신청 처리 중 오류가 발생했습니다."));
        }
    }

    @DeleteMapping("/{gatherNo}/apply")
    public ResponseEntity<?> cancelApplication(@PathVariable Long gatherNo, @RequestParam String userId) {
        try {
            clanGatherService.cancelApplication(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "신청이 취소되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "신청 취소 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/clan/{clanId}/all")
    public ResponseEntity<?> getAllGatherings(@PathVariable Long clanId,
            @RequestParam String userId) {
        try {
            List<ClanGatherResponseDto> gatherings = clanGatherService.getAllGatherings(clanId, userId);
            return ResponseEntity.ok(gatherings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch all gatherings", "error", e.getMessage()));
        }
    }

    @PostMapping("/{gatherNo}/close")
    public ResponseEntity<?> closeGathering(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.closeGathering(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "모집이 종료되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "모집 종료 처리 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/{gatherNo}/reopen")
    public ResponseEntity<?> reopenGathering(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.reopenGathering(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "모집이 재개되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "모집 재개 처리 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/{gatherNo}/applicants")
    public ResponseEntity<?> getApplicants(@PathVariable Long gatherNo) {
        try {
            return ResponseEntity.ok(clanGatherService.getApplicants(gatherNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch applicants", "error", e.getMessage()));
        }
    }

    @PostMapping("/{gatherNo}/match")
    public ResponseEntity<?> performMatching(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.performMatching(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "매핑이 완료되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "매핑 처리 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/{gatherNo}/match-results")
    public ResponseEntity<?> getMatchResults(@PathVariable Long gatherNo) {
        try {
            List<GatheringMatchResultDto> results = clanGatherService.getMatchResults(gatherNo);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch match results", "error", e.getMessage()));
        }
    }

    @PostMapping("/{gatherNo}/swap")
    public ResponseEntity<?> swapMembers(@PathVariable Long gatherNo, @RequestBody MatchSwapRequestDto request) {
        try {
            clanGatherService.swapMembers(gatherNo, request);
            return ResponseEntity.ok(Map.of("message", "Members swapped successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to swap members", "error", e.getMessage()));
        }
    }

    @PostMapping("/{gatherNo}/complete")
    public ResponseEntity<?> completeGathering(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.completeGathering(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "합주 모집이 완전 종료되었습니다."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "완전 종료 처리 중 오류가 발생했습니다."));
        }
    }
}
