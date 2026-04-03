package com.bandi.backend.controller;

import com.bandi.backend.dto.AdminJamDto;
import com.bandi.backend.service.AdminJamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/jams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminJamController {

    private final AdminJamService adminJamService;

    @GetMapping
    public ResponseEntity<List<AdminJamDto>> getAdminJamList(
            @RequestParam(required = false) String searchKeyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        
        List<AdminJamDto> jams = adminJamService.getAdminJamList(searchKeyword, page, size);
        return ResponseEntity.ok(jams);
    }

    @GetMapping("/{bnNo}/sessions")
    public ResponseEntity<?> getSessions(@PathVariable Long bnNo) {
        try {
            return ResponseEntity.ok(adminJamService.getSessionsByBnNo(bnNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching sessions: " + e.getMessage());
        }
    }

    @PostMapping("/{bnNo}/sessions")
    public ResponseEntity<?> addSession(
            @PathVariable Long bnNo,
            @RequestBody Map<String, String> requestData) {
        
        String sessionTypeCd = requestData.get("sessionTypeCd");
        String userId = requestData.get("userId");
        
        if (sessionTypeCd == null || sessionTypeCd.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Session type is required.");
        }
        
        try {
            adminJamService.addSession(bnNo, sessionTypeCd, userId);
            return ResponseEntity.ok().body(Map.of("message", "Session added successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error adding session: " + e.getMessage());
        }
    }

    @DeleteMapping("/{bnNo}/sessions/{sessionNo}")
    public ResponseEntity<?> deleteSession(
            @PathVariable Long bnNo,
            @PathVariable Long sessionNo) {
        try {
            adminJamService.deleteSession(bnNo, sessionNo);
            return ResponseEntity.ok().body(Map.of("message", "Session deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting session: " + e.getMessage());
        }
    }

    @PostMapping("/{bnNo}/push")
    public ResponseEntity<?> sendPush(
            @PathVariable Long bnNo,
            @RequestBody Map<String, String> requestData) {
        
        String pushMessage = requestData.get("pushMessage");
        String adminUserId = requestData.get("adminUserId");
        
        if (pushMessage == null || pushMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Push message is required.");
        }
        
        try {
            adminJamService.sendPushToJam(bnNo, pushMessage, adminUserId);
            return ResponseEntity.ok().body(Map.of("message", "Push notification sent successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error sending push: " + e.getMessage());
        }
    }
}
