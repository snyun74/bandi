package com.bandi.backend.controller;

import com.bandi.backend.dto.BandCreateRequestDto;
import com.bandi.backend.service.BandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.bandi.backend.dto.BandDetailDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bands")
@RequiredArgsConstructor
public class BandController {

    private final BandService bandService;

    @GetMapping
    public ResponseEntity<java.util.List<com.bandi.backend.dto.ClanJamListDto>> getBandList(
            @RequestParam String userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String filterPart) {
        java.util.List<com.bandi.backend.dto.ClanJamListDto> list = bandService.getClanBandList(null, userId, keyword,
                sort, filterPart);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<Long> createBand(@RequestBody BandCreateRequestDto dto) {
        if (dto.getUserId() == null || dto.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().build(); // Basic validation
        }
        Long bnNo = bandService.createBand(dto);
        return ResponseEntity.ok(bnNo);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinBand(@RequestBody com.bandi.backend.dto.BandJoinDto dto) {
        try {
            bandService.joinBand(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Join failed: " + e.getMessage());
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelBand(@RequestBody com.bandi.backend.dto.BandJoinDto dto) {
        try {
            bandService.cancelBand(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cancel failed: " + e.getMessage());
        }
    }

    @PostMapping("/kick")
    public ResponseEntity<?> kickBandMember(@RequestBody java.util.Map<String, Object> params) {
        try {
            bandService.kickBandMember(params);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Kick failed: " + e.getMessage());
        }
    }

    @GetMapping("/{bnNo}")
    public ResponseEntity<?> getBandDetail(@PathVariable Long bnNo, @RequestParam String userId) {
        try {
            BandDetailDto detail = bandService.getBandDetail(bnNo, userId);
            return ResponseEntity.ok(detail);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{bnNo}")
    public ResponseEntity<?> deleteBand(@PathVariable Long bnNo, @RequestParam String userId) {
        try {
            bandService.deleteBand(bnNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{bnNo}/status")
    public ResponseEntity<?> updateBandStatus(@PathVariable Long bnNo,
            @RequestBody java.util.Map<String, String> body) {
        try {
            String userId = body.get("userId");
            String status = body.get("status");
            bandService.updateBandStatus(bnNo, userId, status);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{bnNo}/verify-password")
    public ResponseEntity<?> verifyPassword(@PathVariable Long bnNo, @RequestBody java.util.Map<String, String> body) {
        String password = body.get("password");
        boolean isValid = bandService.verifyBandPassword(bnNo, password);
        if (isValid) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().body("Incorrect password");
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyJams(@RequestParam String userId) {
        try {
            return ResponseEntity.ok(bandService.getMyJams(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch my jams: " + e.getMessage());
        }
    }
}
