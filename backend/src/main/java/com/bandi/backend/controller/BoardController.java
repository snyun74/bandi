package com.bandi.backend.controller;

import com.bandi.backend.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<?> getBoardList(
            @RequestParam String boardTypeFg,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String userId) {
        // userId can be null if not logged in
        String safeUserId = (userId != null) ? userId : "";
        return ResponseEntity.ok(boardService.getBoardList(boardTypeFg, page, size, safeUserId));
    }

    @GetMapping("/hot")
    public ResponseEntity<?> getHotBoardList(@RequestParam(required = false) String userId) {
        String safeUserId = (userId != null) ? userId : "";
        return ResponseEntity.ok(boardService.getHotBoardList(safeUserId));
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentBoardList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(required = false) String userId) {
        String safeUserId = (userId != null) ? userId : "";
        return ResponseEntity.ok(boardService.getRecentBoardList(page, size, safeUserId));
    }

    @PostMapping(value = "/posts", consumes = { "multipart/form-data" })
    public ResponseEntity<?> createBoardPost(
            @RequestPart("data") com.bandi.backend.dto.CommunityBoardCreateDto dto,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        boardService.createBoardPost(dto, file);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/posts/{boardNo}")
    public ResponseEntity<?> getBoardPostDetail(@PathVariable Long boardNo,
            @RequestParam(required = false) String userId) {
        String safeUserId = (userId != null) ? userId : "";
        return ResponseEntity.ok(boardService.getBoardPostDetail(boardNo, safeUserId));
    }

    @GetMapping("/posts/{boardNo}/comments")
    public ResponseEntity<?> getBoardComments(@PathVariable Long boardNo,
            @RequestParam(required = false) String userId) {
        String safeUserId = (userId != null) ? userId : "";
        return ResponseEntity.ok(boardService.getBoardComments(boardNo, safeUserId));
    }

    @PostMapping("/posts/{boardNo}/comments")
    public ResponseEntity<?> createComment(@PathVariable Long boardNo,
            @RequestBody com.bandi.backend.dto.CommunityBoardCommentCreateDto dto) {
        boardService.createComment(boardNo, dto.getUserId(), dto.getContent(), dto.getParentReplyNo(),
                dto.getMaskingYn());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{boardNo}/like")
    public ResponseEntity<?> addBoardLike(@PathVariable Long boardNo,
            @RequestBody com.bandi.backend.dto.CommunityBoardLikeDto dto) {
        boardService.addBoardLike(boardNo, dto.getUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/comments/{replyNo}/like")
    public ResponseEntity<?> addCommentLike(@PathVariable Long replyNo,
            @RequestBody com.bandi.backend.dto.CommunityBoardLikeDto dto) {
        boardService.addCommentLike(replyNo, dto.getUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{boardNo}/scrap")
    public ResponseEntity<?> toggleScrap(@PathVariable Long boardNo,
            @RequestBody com.bandi.backend.dto.CommunityBoardLikeDto dto) {
        boardService.toggleScrap(boardNo, dto.getUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/posts/{boardNo}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long boardNo,
            @RequestParam String userId) {
        try {
            boardService.deleteBoard(boardNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PutMapping(value = "/posts/{boardNo}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateBoardPost(
            @PathVariable Long boardNo,
            @RequestPart("data") com.bandi.backend.dto.CommunityBoardCreateDto dto,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        try {
            boardService.updateBoardPost(boardNo, dto, file);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PostMapping("/report")
    public ResponseEntity<?> reportPost(@RequestBody com.bandi.backend.dto.CmReportDto dto) {
        boardService.reportPost(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockUser(@RequestBody com.bandi.backend.dto.CmBlockDto dto) {
        boardService.blockUser(dto);
        return ResponseEntity.ok().build();
    }
}
