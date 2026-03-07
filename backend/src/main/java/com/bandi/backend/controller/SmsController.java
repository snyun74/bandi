package com.bandi.backend.controller;

import com.bandi.backend.service.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {

    private final SmsService smsService;

    @PostMapping("/send-verification")
    public String sendVerificationCode(@RequestParam String phoneNumber) {
        String code = smsService.generateVerificationCode();
        boolean success = smsService.sendVerificationCode(phoneNumber, code);

        if (success) {
            return "OK";
        } else {
            return "발송 실패";
        }
    }

    @PostMapping("/verify-code")
    public String verifyCode(@RequestParam String phoneNumber, @RequestParam String code) {
        boolean isVerified = smsService.verifyCode(phoneNumber, code);
        return isVerified ? "OK" : "인증번호가 일치하지 않거나 만료되었습니다.";
    }
}
