package com.bandi.backend.controller;

import com.bandi.backend.entity.common.Notice;
import com.bandi.backend.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminNoticeController {

    private final NoticeService noticeService;

    @GetMapping("/list")
    public ResponseEntity<List<Notice>> getNoticeList() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveNotice(@RequestBody Notice notice, @RequestParam String userId) {
        try {
            Notice savedNotice = noticeService.saveNotice(notice, userId);
            return ResponseEntity.ok(savedNotice);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    @GetMapping("/{noticeNo}")
    public ResponseEntity<Notice> getNotice(@PathVariable Long noticeNo) {
        return ResponseEntity.ok(noticeService.getNotice(noticeNo));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Notice>> getActiveNotices() {
        return ResponseEntity.ok(noticeService.getActiveNotices());
    }
}
