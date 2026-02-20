package com.bandi.backend.controller;

import com.bandi.backend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("/search")
    public ResponseEntity<List<com.bandi.backend.dto.FriendResponseDto>> searchFriend(@RequestParam String keyword,
            @RequestParam String userId) {
        return ResponseEntity.ok(friendService.searchFriend(keyword, userId));
    }

    @PostMapping("/request")
    public ResponseEntity<String> requestFriend(@RequestBody Map<String, String> request) {
        String userId = request.get("userId"); // 로그인한 사용자 ID
        String friendUserId = request.get("friendUserId"); // 친구 요청할 사용자 ID

        try {
            friendService.addFriend(userId, friendUserId);
            return ResponseEntity.ok("친구 요청을 보냈습니다.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/new")
    public ResponseEntity<List<com.bandi.backend.dto.FriendResponseDto>> getNewFriends(@RequestParam String userId) {
        return ResponseEntity.ok(friendService.getNewFriends(userId));
    }

    @GetMapping("/list")
    public ResponseEntity<List<com.bandi.backend.dto.FriendResponseDto>> getFriends(@RequestParam String userId) {
        return ResponseEntity.ok(friendService.getFriends(userId));
    }

    @PostMapping("/accept")
    public ResponseEntity<String> acceptFriend(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String friendUserId = request.get("friendUserId");
        friendService.acceptFriend(userId, friendUserId);
        return ResponseEntity.ok("친구 요청을 수락했습니다.");
    }

    @PostMapping("/reject")
    public ResponseEntity<String> rejectFriend(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String friendUserId = request.get("friendUserId");
        friendService.rejectFriend(userId, friendUserId);
        return ResponseEntity.ok("친구 요청을 거절했습니다.");
    }
}
