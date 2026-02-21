package com.bandi.backend.controller;

import com.bandi.backend.dto.UserProfileDto;
import com.bandi.backend.dto.UserProfileUpdateDto;
import com.bandi.backend.dto.MyScrapDto;
import com.bandi.backend.dto.MyPostDto;
import com.bandi.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import java.util.List;
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

    @GetMapping("/{userId}/scraps")
    public ResponseEntity<List<MyScrapDto>> getMyScraps(@PathVariable String userId) {
        return ResponseEntity.ok(userService.getMyScrapList(userId));
    }

    @GetMapping("/{userId}/posts")
    public ResponseEntity<List<MyPostDto>> getMyPosts(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getMyPosts(userId, page, size));
    }

    @GetMapping("/{userId}/commented-posts")
    public ResponseEntity<List<MyPostDto>> getMyCommentedPosts(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getMyCommentedPosts(userId, page, size));
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
