package com.bandi.backend.controller;

import com.bandi.backend.dto.GroupChatCreateDto;
import com.bandi.backend.dto.GroupChatMemberDto;
import com.bandi.backend.service.GroupChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/group-chat")
@RequiredArgsConstructor
public class GroupChatController {

    private final GroupChatService groupChatService;

    @GetMapping("/members")
    public ResponseEntity<List<GroupChatMemberDto>> getEligibleMembers(@RequestParam String userId) {
        List<GroupChatMemberDto> members = groupChatService.getEligibleMembers(userId);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/room")
    public ResponseEntity<Long> createGroupChat(@RequestParam String userId, @RequestBody GroupChatCreateDto dto) {
        Long roomNo = groupChatService.createGroupChat(userId, dto);
        return ResponseEntity.ok(roomNo);
    }

    @GetMapping("/room/{roomNo}/members")
    public ResponseEntity<List<GroupChatMemberDto>> getRoomMembers(@PathVariable Long roomNo) {
        List<GroupChatMemberDto> members = groupChatService.getRoomMembers(roomNo);
        return ResponseEntity.ok(members);
    }

    @PostMapping("/room/{roomNo}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable Long roomNo, @RequestParam String userId) {
        groupChatService.leaveRoom(roomNo, userId);
        return ResponseEntity.ok().build();
    }
}
