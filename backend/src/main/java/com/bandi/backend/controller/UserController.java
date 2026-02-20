package com.bandi.backend.controller;

import com.bandi.backend.dto.UserProfileDto;
import com.bandi.backend.dto.UserProfileUpdateDto;
import com.bandi.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileDto> getUserProfile(@PathVariable String userId) {
        UserProfileDto dto = userService.getUserProfile(userId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping(value = "/profile", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> updateUserProfile(
            @RequestPart("data") UserProfileUpdateDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            userService.updateUserProfile(dto, file);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to update profile: " + e.getMessage());
        }
    }
}
