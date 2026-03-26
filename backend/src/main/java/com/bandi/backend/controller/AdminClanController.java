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
    private final com.bandi.backend.service.QaService qaService;

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

    @GetMapping("/dashboard/counts")
    public ResponseEntity<?> getDashboardCounts() {
        long pendingClans = adminService.getPendingClanCount();
        long unansweredQas = qaService.countUnansweredQas();
        long reportCount = adminService.getUnprocessedReportCount();

        return ResponseEntity.ok(java.util.Map.of(
                "pendingClans", pendingClans,
                "unansweredQas", unansweredQas,
                "reportCount", reportCount));
    }

    @GetMapping("/reports")
    public org.springframework.data.domain.Page<com.bandi.backend.repository.CmReportProjection> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(required = false) String search) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return adminService.getReports(search, pageable);
    }

    @GetMapping("/blocks")
    public org.springframework.data.domain.Page<com.bandi.backend.repository.CmBlockProjection> getBlocks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(required = false) String search) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return adminService.getBlocks(search, pageable);
    }

    @DeleteMapping("/blocks")
    public ResponseEntity<?> deleteBlock(
            @RequestParam("userId") String userId,
            @RequestParam("blockUserId") String blockUserId) {
        try {
            adminService.deleteBlock(userId, blockUserId);
            return ResponseEntity.ok().body("Block deleted successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting block: " + e.getMessage());
        }
    }
}
