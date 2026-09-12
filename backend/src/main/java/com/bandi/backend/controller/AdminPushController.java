package com.bandi.backend.controller;

import com.bandi.backend.dto.AdminDeviceStatsDto;
import com.bandi.backend.dto.AdminPushHistoryDto;
import com.bandi.backend.dto.AdminPushRequestDto;
import com.bandi.backend.service.AdminPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/push")
@RequiredArgsConstructor
public class AdminPushController {

    private final AdminPushService adminPushService;

    @GetMapping("/device-stats")
    public ResponseEntity<AdminDeviceStatsDto> getDeviceStats() {
        return ResponseEntity.ok(adminPushService.getDeviceStats());
    }

    @GetMapping("/history")
    public ResponseEntity<List<AdminPushHistoryDto>> getPushHistory(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(adminPushService.getPushHistory(limit));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendPush(@RequestBody AdminPushRequestDto dto) {
        try {
            Map<String, Object> result = adminPushService.sendAdminPush(dto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
