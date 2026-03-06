package com.bandi.backend.controller;

import com.bandi.backend.dto.PushTokenRequestDto;
import com.bandi.backend.service.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final PushService pushService;

    @PostMapping("/token")
    public ResponseEntity<String> saveToken(@RequestBody PushTokenRequestDto dto) {
        pushService.saveToken(dto.getUserId(), dto.getToken(), dto.getDeviceType());
        return ResponseEntity.ok("Token saved successfully");
    }

    // 테스트용 발송 API
    @PostMapping("/test")
    public ResponseEntity<String> testPush(@RequestParam String userId, @RequestParam String title,
            @RequestParam String body) {
        pushService.sendPush(userId, title, body, "/main", "SN");
        return ResponseEntity.ok("Push sent successfully");
    }

    @PostMapping("/read/{logNo}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long logNo) {
        pushService.updateReadStatus(logNo);
        return ResponseEntity.ok().build();
    }
}
