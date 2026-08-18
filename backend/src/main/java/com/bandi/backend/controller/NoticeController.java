package com.bandi.backend.controller;

import com.bandi.backend.entity.common.Notice;
import com.bandi.backend.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping("/active")
    public ResponseEntity<List<Notice>> getActiveNotices() {
        return ResponseEntity.ok(noticeService.getActiveNotices());
    }

    @GetMapping("/{noticeNo}")
    public ResponseEntity<Notice> getNoticeDetail(@PathVariable Long noticeNo) {
        return ResponseEntity.ok(noticeService.getNotice(noticeNo));
    }
}
