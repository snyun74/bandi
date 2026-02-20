package com.bandi.backend.controller;

import com.bandi.backend.dto.ChatMessageCreateDto;
import com.bandi.backend.dto.ChatMessageDto;
import com.bandi.backend.dto.ChatRoomListDto;
import com.bandi.backend.service.JamChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/jam-chat")
@RequiredArgsConstructor
public class JamChatController {

    private final JamChatService jamChatService;

    @GetMapping("/{roomNo}")
    public ResponseEntity<ChatRoomListDto> getChatRoomInfo(@PathVariable Long roomNo) {
        ChatRoomListDto roomInfo = jamChatService.getChatRoomInfo(roomNo);
        if (roomInfo != null) {
            return ResponseEntity.ok(roomInfo);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{roomNo}/messages")
    public ResponseEntity<List<ChatMessageDto>> getChatMessages(
            @PathVariable Long roomNo,
            @RequestParam String userId,
            @RequestParam(required = false) Long lastMsgNo) {

        List<ChatMessageDto> messages = jamChatService.getChatMessages(roomNo, userId, lastMsgNo);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{roomNo}/users")
    public ResponseEntity<List<com.bandi.backend.dto.FriendResponseDto>> getChatRoomUsers(@PathVariable Long roomNo) {
        List<com.bandi.backend.dto.FriendResponseDto> users = jamChatService.getChatRoomUsers(roomNo);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/message")
    public ResponseEntity<ChatMessageDto> createMessage(@RequestBody ChatMessageCreateDto dto) {
        log.info("Received message create request: {}", dto);
        try {
            ChatMessageDto savedMessage = jamChatService.saveMessage(dto);
            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            log.error("ERROR in createMessage", e);
            throw e;
        }
    }

    @PostMapping(value = "/upload", consumes = { "multipart/form-data" })
    public ResponseEntity<Map<String, Object>> uploadChatFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam String userId) {
        Map<String, Object> result = jamChatService.uploadChatFile(file, userId);
        return ResponseEntity.ok(result);
    }
}
