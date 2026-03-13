package com.bandi.backend.controller;

import com.bandi.backend.dto.AdminUserDto;
import com.bandi.backend.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/list")
    public ResponseEntity<List<AdminUserDto>> getUserList() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getUserStats() {
        return ResponseEntity.ok(adminUserService.getUserGenderStats());
    }

    @PutMapping("/{userId}/withdraw")
    public ResponseEntity<?> withdrawUser(@PathVariable String userId, @RequestBody Map<String, String> body) {
        String updId = body.get("updId");
        try {
            adminUserService.withdrawUser(userId, updId);
            return ResponseEntity.ok().body("User withdrawn successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error withdrawing user: " + e.getMessage());
        }
    }
}
