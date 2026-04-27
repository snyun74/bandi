package com.bandi.backend.controller;

import com.bandi.backend.dto.PostCreateDto;
import com.bandi.backend.dto.ShortsCreateDto;
import com.bandi.backend.service.SnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/sns")
@RequiredArgsConstructor
public class SnsController {

    private final SnsService snsService;

    @PostMapping(value = "/posts", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createPost(
            @RequestPart("data") PostCreateDto dto,
            @RequestPart("files") List<MultipartFile> files) {
        
        try {
            snsService.createPost(dto, files);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("서버 내부 오류가 발생했습니다.");
        }
    }

    @PostMapping(value = "/shorts", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createShorts(
            @RequestPart("data") ShortsCreateDto dto,
            @RequestPart("video") MultipartFile video,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        
        try {
            snsService.createShorts(dto, video, thumbnail);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("서버 내부 오류가 발생했습니다.");
        }
    }

    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<?> getPostsByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPostsByUser(userId, pageable));
    }

    @GetMapping("/shorts/user/{userId}")
    public ResponseEntity<?> getShortsByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getShortsByUser(userId, pageable));
    }

    @GetMapping("/posts/public")
    public ResponseEntity<?> getPublicPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPublicPosts(pageable));
    }

    @GetMapping("/shorts/public")
    public ResponseEntity<?> getPublicShorts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPublicShorts(pageable));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId, @RequestParam String userId) {
        try {
            snsService.deletePost(postId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/shorts/{shortsNo}")
    public ResponseEntity<?> deleteShorts(@PathVariable Long shortsNo, @RequestParam String userId) {
        try {
            snsService.deleteShorts(shortsNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}
