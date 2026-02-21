package com.bandi.backend.controller;

import com.bandi.backend.dto.AdminClanApprovalDto;
import com.bandi.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/clans")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminClanController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdminClanApprovalDto>> getAdminClans() {
        return ResponseEntity.ok(adminService.getAdminClans());
    }

    @PutMapping("/{cnNo}/status")
    public ResponseEntity<?> updateClanStatus(
            @PathVariable Long cnNo,
            @RequestParam("status") String status,
            @RequestParam("userId") String userId) {
        try {
            adminService.updateClanApprStatCd(cnNo, status, userId);
            return ResponseEntity.ok().body("Clan status updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating clan status: " + e.getMessage());
        }
    }
}
