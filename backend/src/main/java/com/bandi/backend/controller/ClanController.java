package com.bandi.backend.controller;

import com.bandi.backend.dto.ClanCreateDto;

import com.bandi.backend.entity.clan.ClanBoardType;
import com.bandi.backend.service.ClanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clans")
@RequiredArgsConstructor
public class ClanController {

    private final ClanService clanService;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createClan(
            @RequestPart("data") ClanCreateDto dto,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        try {
            Long clanId = clanService.createClan(dto, file);
            return ResponseEntity.ok(Map.of("message", "Clan created successfully", "clanId", clanId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to create clan", "error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getClanList(@RequestParam(required = false) String name) {
        try {
            return ResponseEntity.ok(clanService.getClanList(name));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch clan list", "error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyClan(@RequestParam String userId) {
        try {
            return ResponseEntity.ok(clanService.getMyClan(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch my clan", "error", e.getMessage()));
        }
    }

    @GetMapping("/my-list")
    public ResponseEntity<?> getMyClanList(@RequestParam String userId) {
        try {
            return ResponseEntity.ok(clanService.getMyClanList(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch my clan list", "error", e.getMessage()));
        }
    }

    @GetMapping("/{clanId}")
    public ResponseEntity<?> getClanDetail(@PathVariable Long clanId, @RequestParam(required = false) String userId) {
        try {
            // Treat null userId as empty string or handle in query?
            // If userId is null, the query comparison `m.sndUserId <> :userId` might behave
            // unpredictably or just work if we pass empty string.
            // But `NOT EXISTS` with null userId will likely match nothing if we are strict.
            // If userId is null (not logged in), unread count should probably be 0.
            // I'll ensure we pass a non-null string if possible, or handle null in service.
            // For now passing as is, but if null, JPA might complain or return empty.
            // Let's rely on frontend passing it if logged in.
            return ResponseEntity.ok(clanService.getClanDetail(clanId, userId != null ? userId : ""));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch clan detail", "error", e.getMessage()));
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinClan(@RequestBody com.bandi.backend.dto.ClanJoinDto dto) {
        try {
            clanService.joinClan(dto);
            return ResponseEntity.ok(Map.of("message", "Clan join requested successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to request clan join", "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/boards/types")
    public ResponseEntity<?> createClanBoardType(@PathVariable Long id,
            @RequestBody com.bandi.backend.dto.ClanBoardTypeCreateDto dto) {
        try {
            dto.setCnNo(id); // Ensure ID consistency
            clanService.createClanBoardType(dto);
            return ResponseEntity.ok(Map.of("message", "Clan board type created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to create clan board type", "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/boards/types")
    public ResponseEntity<?> getClanBoardTypes(@PathVariable Long id) {
        try {
            List<ClanBoardType> types = clanService.getClanBoardTypeList(id);
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch clan board types", "error", e.getMessage()));
        }
    }

    @GetMapping("/{clanId}/status")
    public ResponseEntity<?> getMemberStatus(@PathVariable Long clanId, @RequestParam String userId) {
        try {
            String status = clanService.getMemberStatus(clanId, userId);
            return ResponseEntity.ok(Map.of("status", status));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch member status", "error", e.getMessage()));
        }
    }

    @GetMapping("/{clanId}/members")
    public ResponseEntity<?> getClanMembers(@PathVariable Long clanId) {
        try {
            return ResponseEntity.ok(clanService.getClanMembers(clanId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch clan members", "error", e.getMessage()));
        }
    }

    @PutMapping("/{clanId}/members/status")
    public ResponseEntity<?> updateMemberStatus(@PathVariable Long clanId, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            String status = body.get("status");
            clanService.updateMemberStatus(clanId, userId, status);
            return ResponseEntity.ok(Map.of("message", "Member status updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to update member status", "error", e.getMessage()));
        }
    }

    @GetMapping("/{clanId}/members/{userId}/role")
    public ResponseEntity<?> getMemberRole(@PathVariable Long clanId, @PathVariable String userId) {
        try {
            return ResponseEntity.ok(clanService.getMemberRole(clanId, userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch member role", "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/boards/hot")
    public ResponseEntity<?> getHotBoardPosts(@PathVariable Long id) {
        try {
            List<com.bandi.backend.dto.HotBoardPostDto> posts = clanService.getHotBoardPosts(id);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch hot board posts", "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/boards/top")
    public ResponseEntity<?> getTopBoardPosts(@PathVariable Long id) {
        try {
            List<com.bandi.backend.dto.HotBoardPostDto> posts = clanService.getTopBoardPosts(id);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch top board posts", "error", e.getMessage()));
        }
    }

    @GetMapping("/boards/{boardTypeNo}/posts")
    public ResponseEntity<?> getBoardPostList(
            @PathVariable Long boardTypeNo,
            @RequestParam(required = false) String keyword) {
        try {
            return ResponseEntity.ok(clanService.getBoardPostList(boardTypeNo, keyword));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch board posts", "error", e.getMessage()));
        }
    }

    @PostMapping(value = "/boards/{boardTypeNo}/posts", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createBoardPost(
            @PathVariable Long boardTypeNo,
            @RequestPart("data") com.bandi.backend.dto.ClanBoardCreateDto dto,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        try {
            System.out.println("DEBUG: ClanController createBoardPost. BoardTypeNo=" + boardTypeNo + ", Title="
                    + dto.getTitle() + ", File=" + (file != null ? file.getOriginalFilename() : "null"));
            dto.setCnBoardTypeNo(boardTypeNo);
            clanService.createBoardPost(dto, file);
            return ResponseEntity.ok(Map.of("message", "Board post created successfully"));
        } catch (Exception e) {
            System.err.println("ERROR: ClanController createBoardPost failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to create board post", "error", e.getMessage()));
        }
    }

    @GetMapping("/boards/posts/{boardNo}")
    public ResponseEntity<?> getBoardPostDetail(@PathVariable Long boardNo) {
        try {
            return ResponseEntity.ok(clanService.getBoardPostDetail(boardNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch board post detail", "error", e.getMessage()));
        }
    }

    @GetMapping("/boards/posts/{boardNo}/comments")
    public ResponseEntity<?> getBoardComments(@PathVariable Long boardNo) {
        try {
            return ResponseEntity.ok(clanService.getBoardComments(boardNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to fetch board comments", "error", e.getMessage()));
        }
    }

    @PostMapping("/boards/posts/{boardNo}/comments")
    public ResponseEntity<?> createComment(@PathVariable Long boardNo, @RequestBody Map<String, Object> body) {
        try {
            String userId = (String) body.get("userId");
            String content = (String) body.get("content");
            Long parentReplyNo = null;
            if (body.get("parentReplyNo") != null) {
                parentReplyNo = ((Number) body.get("parentReplyNo")).longValue();
            }
            clanService.createComment(boardNo, userId, content, parentReplyNo);
            return ResponseEntity.ok(Map.of("message", "Comment created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to create comment", "error", e.getMessage()));
        }
    }

    @PostMapping("/boards/posts/{boardNo}/like")
    public ResponseEntity<?> addBoardLike(@PathVariable Long boardNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanService.addBoardLike(boardNo, userId);
            return ResponseEntity.ok(Map.of("message", "Like added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to add like", "error", e.getMessage()));
        }
    }

    @PostMapping("/boards/comments/{replyNo}/like")
    public ResponseEntity<?> addCommentLike(@PathVariable Long replyNo, @RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            clanService.addCommentLike(replyNo, userId);
            return ResponseEntity.ok(Map.of("message", "Comment like added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to add comment like", "error", e.getMessage()));
        }
    }
}
