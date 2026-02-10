package com.bandi.backend.controller;

import com.bandi.backend.dto.ChatRoomListDto;

import com.bandi.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/list")
    public ResponseEntity<List<ChatRoomListDto>> getGroupChatList(@RequestParam String userId) {

        List<ChatRoomListDto> chatList = chatService.getGroupChatList(userId);
        return ResponseEntity.ok(chatList);
    }

    @GetMapping("/{roomNo}")
    public ResponseEntity<ChatRoomListDto> getChatRoomInfo(
            @org.springframework.web.bind.annotation.PathVariable Long roomNo) {
        ChatRoomListDto roomInfo = chatService.getChatRoomInfo(roomNo);
        if (roomInfo != null) {
            return ResponseEntity.ok(roomInfo);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{roomNo}/messages")
    public ResponseEntity<List<com.bandi.backend.dto.ChatMessageDto>> getChatMessages(
            @org.springframework.web.bind.annotation.PathVariable Long roomNo,
            @RequestParam String userId,
            @RequestParam(required = false) Long lastMsgNo) {

        List<com.bandi.backend.dto.ChatMessageDto> messages = chatService.getChatMessages(roomNo, userId, lastMsgNo);
        return ResponseEntity.ok(messages);
    }

    @org.springframework.web.bind.annotation.PostMapping("/message")
    public ResponseEntity<com.bandi.backend.dto.ChatMessageDto> createMessage(
            @org.springframework.web.bind.annotation.RequestBody com.bandi.backend.dto.ChatMessageCreateDto dto) {
        com.bandi.backend.dto.ChatMessageDto savedMessage = chatService.saveMessage(dto);
        return ResponseEntity.ok(savedMessage);
    }

    @org.springframework.web.bind.annotation.PostMapping(value = "/upload", consumes = { "multipart/form-data" })
    public ResponseEntity<java.util.Map<String, Object>> uploadChatFile(
            @org.springframework.web.bind.annotation.RequestPart("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam String userId) {
        java.util.Map<String, Object> result = chatService.uploadChatFile(file, userId);
        return ResponseEntity.ok(result);
    }

    // 1:1 Chat APIs
    @GetMapping("/private/room-id")
    public ResponseEntity<Long> getPrivateChatRoomId(@RequestParam String userId, @RequestParam String friendUserId) {
        Long roomId = chatService.getPrivateChatRoomId(userId, friendUserId);
        if (roomId != null) {
            return ResponseEntity.ok(roomId);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/private/{roomNo}/messages")
    public ResponseEntity<List<com.bandi.backend.dto.ChatMessageDto>> getPrivateChatMessages(
            @org.springframework.web.bind.annotation.PathVariable Long roomNo,
            @RequestParam String userId,
            @RequestParam(required = false) Long lastMsgNo) {

        List<com.bandi.backend.dto.ChatMessageDto> messages = chatService.getPrivateChatMessages(roomNo, userId,
                lastMsgNo);
        return ResponseEntity.ok(messages);
    }

    @org.springframework.web.bind.annotation.PostMapping("/private/message")
    public ResponseEntity<com.bandi.backend.dto.ChatMessageDto> createPrivateMessage(
            @org.springframework.web.bind.annotation.RequestBody com.bandi.backend.dto.ChatMessageCreateDto dto) {
        com.bandi.backend.dto.ChatMessageDto savedMessage = chatService.savePrivateMessage(dto);
        return ResponseEntity.ok(savedMessage);
    }
}
