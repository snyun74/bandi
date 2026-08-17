package com.bandi.backend.controller;

import com.bandi.backend.entity.band.BnAmbassador;
import com.bandi.backend.service.AdminAmbassadorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/ambassadors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminAmbassadorController {

    private final AdminAmbassadorService adminAmbassadorService;

    @GetMapping
    public ResponseEntity<List<AdminAmbassadorService.AdminAmbassadorDto>> getAmbassadors() {
        return ResponseEntity.ok(adminAmbassadorService.getAllAmbassadorsForAdmin());
    }

    @GetMapping("/pending-count")
    public ResponseEntity<Map<String, Long>> getPendingCount() {
        return ResponseEntity.ok(Map.of("pendingCount", adminAmbassadorService.getPendingCount()));
    }

    @PutMapping("/{targetUserId}/status")
    public ResponseEntity<?> updateAmbassadorStatus(
            @PathVariable String targetUserId,
            @RequestParam String status,
            @RequestParam(required = false) String rejectReason,
            @RequestParam String userId) {
        try {
            BnAmbassador updated = adminAmbassadorService.updateAmbassadorStatus(targetUserId, status, rejectReason, userId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
