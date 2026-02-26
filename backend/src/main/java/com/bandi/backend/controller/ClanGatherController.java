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

@RestController
@RequestMapping("/api/clans/gatherings")
@RequiredArgsConstructor
public class ClanGatherController {

    private final ClanGatherService clanGatherService;

    @PostMapping
    public ResponseEntity<?> createGathering(@RequestBody ClanGatherCreateDto dto) {
        try {
            Long gatherNo = clanGatherService.createGathering(dto);
            return ResponseEntity.ok(Map.of("message", "Gathering notice created successfully", "gatherNo", gatherNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to create gathering notice", "error", e.getMessage()));
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
            return ResponseEntity.ok(Map.of("message", "Application submitted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to submit application", "error", e.getMessage()));
        }
    }

    @DeleteMapping("/{gatherNo}/apply")
    public ResponseEntity<?> cancelApplication(@PathVariable Long gatherNo, @RequestParam String userId) {
        try {
            clanGatherService.cancelApplication(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "Application cancelled successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to cancel application", "error", e.getMessage()));
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
            return ResponseEntity.ok(Map.of("message", "Recruitment closed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to close recruitment", "error", e.getMessage()));
        }
    }

    @PostMapping("/{gatherNo}/reopen")
    public ResponseEntity<?> reopenGathering(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.reopenGathering(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "Recruitment re-opened successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to re-open recruitment", "error", e.getMessage()));
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
            return ResponseEntity.ok(Map.of("message", "Matching completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to perform matching", "error", e.getMessage()));
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

    @PostMapping("/{gatherNo}/complete")
    public ResponseEntity<?> completeGathering(@PathVariable Long gatherNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanGatherService.completeGathering(gatherNo, userId);
            return ResponseEntity.ok(Map.of("message", "Gathering completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to complete gathering", "error", e.getMessage()));
        }
    }
}
