package com.bandi.backend.controller;

import com.bandi.backend.dto.PostCreateDto;
import com.bandi.backend.dto.ShortsCreateDto;
import com.bandi.backend.dto.SnsCommentCreateDto;
import com.bandi.backend.service.SnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @RequestParam(required = false) String currentUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPostsByUser(userId, currentUserId, pageable));
    }

    @GetMapping("/shorts/user/{userId}")
    public ResponseEntity<?> getShortsByUser(
            @PathVariable String userId,
            @RequestParam(required = false) String currentUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getShortsByUser(userId, currentUserId, pageable));
    }

    @GetMapping("/posts/public")
    public ResponseEntity<?> getPublicPosts(
            @RequestParam(required = false) String currentUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPublicPosts(currentUserId, pageable));
    }

    @GetMapping("/shorts/public")
    public ResponseEntity<?> getPublicShorts(
            @RequestParam(required = false) String currentUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(snsService.getPublicShorts(currentUserId, pageable));
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

    @PatchMapping("/posts/{postId}/public-type")
    public ResponseEntity<?> updatePostPublicType(@PathVariable Long postId, @RequestParam String userId, @RequestParam String publicTypeCd) {
        try {
            snsService.updatePostPublicType(postId, userId, publicTypeCd);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PatchMapping("/shorts/{shortsNo}/public-type")
    public ResponseEntity<?> updateShortsPublicType(@PathVariable Long shortsNo, @RequestParam String userId, @RequestParam String publicTypeCd) {
        try {
            snsService.updateShortsPublicType(shortsNo, userId, publicTypeCd);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // ==========================================
    // 1. 조회수 (View) API
    // ==========================================
    @PostMapping("/posts/{postId}/view")
    public ResponseEntity<?> recordPostView(@PathVariable Long postId, @RequestParam(required = false) String userId) {
        long totalViews = snsService.recordPostView(postId, userId);
        return ResponseEntity.ok().body(totalViews);
    }

    @PostMapping("/shorts/{shortsNo}/view")
    public ResponseEntity<?> recordShortsView(@PathVariable Long shortsNo, @RequestParam(required = false) String userId) {
        long totalViews = snsService.recordShortsView(shortsNo, userId);
        return ResponseEntity.ok().body(totalViews);
    }

    // ==========================================
    // 2. 좋아요 / 별루예요 (Action) API
    // ==========================================
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<?> togglePostLike(
            @PathVariable Long postId,
            @RequestParam String userId,
            @RequestParam String actionTypeFg) {
        try {
            return ResponseEntity.ok(snsService.togglePostLike(postId, userId, actionTypeFg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/shorts/{shortsNo}/like")
    public ResponseEntity<?> toggleShortsLike(
            @PathVariable Long shortsNo,
            @RequestParam String userId,
            @RequestParam String actionTypeFg) {
        try {
            return ResponseEntity.ok(snsService.toggleShortsLike(shortsNo, userId, actionTypeFg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ==========================================
    // 3. 댓글 (Comments) API
    // ==========================================
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<?> getPostComments(@PathVariable Long postId) {
        return ResponseEntity.ok(snsService.getPostComments(postId));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createPostComment(
            @PathVariable Long postId,
            @RequestBody SnsCommentCreateDto dto) {
        try {
            return ResponseEntity.ok(snsService.createPostComment(postId, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage() != null ? e.getMessage() : "댓글 등록 중 오류가 발생했습니다.");
        }
    }

    @DeleteMapping("/posts/comments/{replyNo}")
    public ResponseEntity<?> deletePostComment(
            @PathVariable Long replyNo,
            @RequestParam String userId) {
        try {
            snsService.deletePostComment(replyNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @GetMapping("/shorts/{shortsNo}/comments")
    public ResponseEntity<?> getShortsComments(@PathVariable Long shortsNo) {
        return ResponseEntity.ok(snsService.getShortsComments(shortsNo));
    }

    @PostMapping("/shorts/{shortsNo}/comments")
    public ResponseEntity<?> createShortsComment(
            @PathVariable Long shortsNo,
            @RequestBody SnsCommentCreateDto dto) {
        try {
            return ResponseEntity.ok(snsService.createShortsComment(shortsNo, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage() != null ? e.getMessage() : "댓글 등록 중 오류가 발생했습니다.");
        }
    }

    @DeleteMapping("/shorts/comments/{replyNo}")
    public ResponseEntity<?> deleteShortsComment(
            @PathVariable Long replyNo,
            @RequestParam String userId) {
        try {
            snsService.deleteShortsComment(replyNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}
