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
        boardService.createComment(boardNo, dto.getUserId(), dto.getContent(), dto.getParentReplyNo());
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
}
