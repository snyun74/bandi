package com.bandi.backend.controller;

import com.bandi.backend.dto.BnVoteDetailDto;
import com.bandi.backend.dto.BnVoteListDto;
import com.bandi.backend.dto.BnVoteStatusDto;
import com.bandi.backend.service.BnVoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jam-vote")
@RequiredArgsConstructor
public class BnVoteController {

    private final BnVoteService bnVoteService;

    @PostMapping("/create")
    public ResponseEntity<?> createVote(@RequestBody Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            Long roomId = Long.valueOf(String.valueOf(payload.get("roomId")));
            String userId = (String) payload.get("userId");
            Boolean allowMultiple = (Boolean) payload.get("allowMultiple");
            String endTime = (String) payload.get("endTime");
            List<String> options = (List<String>) payload.get("options");

            Long voteId = bnVoteService.createVote(roomId, userId, title, allowMultiple, endTime, options);
            return ResponseEntity.ok(Map.of("voteId", voteId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitVote(@RequestBody Map<String, Object> payload) {
        try {
            Long voteId = Long.valueOf(String.valueOf(payload.get("voteId")));
            String userId = (String) payload.get("userId");
            List<Integer> itemIds = (List<Integer>) payload.get("itemIds");

            bnVoteService.submitVote(voteId, userId, itemIds);
            return ResponseEntity.ok("투표가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelVote(@RequestBody Map<String, Object> payload) {
        try {
            Long voteId = Long.valueOf(String.valueOf(payload.get("voteId")));
            String userId = (String) payload.get("userId");

            bnVoteService.cancelVote(voteId, userId);
            return ResponseEntity.ok("투표가 취소되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{voteId}")
    public ResponseEntity<?> getVoteDetail(@PathVariable Long voteId, @RequestParam(required = false) String userId) {
        try {
            BnVoteDetailDto detail = bnVoteService.getVoteDetail(voteId, userId);
            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{voteId}/status")
    public ResponseEntity<?> getVoteStatus(@PathVariable Long voteId) {
        try {
            BnVoteStatusDto status = bnVoteService.getVoteStatus(voteId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list/{roomId}")
    public ResponseEntity<?> getVoteList(@PathVariable Long roomId, @RequestParam(required = false) String userId) {
        try {
            List<BnVoteListDto> list = bnVoteService.getVoteList(roomId, userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
