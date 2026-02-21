package com.bandi.backend.controller;

import com.bandi.backend.dto.AdBannerDto;
import com.bandi.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<AdBannerDto>> getBanners() {
        return ResponseEntity.ok(adminService.getBanners());
    }

    @GetMapping("/{adBannerCd}")
    public ResponseEntity<AdBannerDto> getBanner(@PathVariable String adBannerCd) {
        AdBannerDto banner = adminService.getBannerByCd(adBannerCd);
        if (banner != null) {
            return ResponseEntity.ok(banner);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{adBannerCd}")
    public ResponseEntity<?> updateBannerAttachment(
            @PathVariable String adBannerCd,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("userId") String userId,
            @RequestParam(value = "linkUrl", required = false) String linkUrl) {

        try {
            adminService.updateBannerAttachment(adBannerCd, file, userId, linkUrl);
            return ResponseEntity.ok().body("Banner attachment updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating banner: " + e.getMessage());
        }
    }
}
