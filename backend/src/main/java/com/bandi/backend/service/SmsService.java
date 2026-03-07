package com.bandi.backend.service;

import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

@Service
@Slf4j
public class SmsService {

    @Value("${coolsms.api-key}")
    private String apiKey;

    @Value("${coolsms.api-secret}")
    private String apiSecret;

    @Value("${coolsms.from-number}")
    private String fromNumber;

    private DefaultMessageService messageService;

    // 인증번호 저장 (Key: 휴대폰번호, Value: 인증정보)
    private final ConcurrentHashMap<String, VerificationInfo> verificationStore = new ConcurrentHashMap<>();

    private static class VerificationInfo {
        String code;
        LocalDateTime expiry;
        boolean verified;

        VerificationInfo(String code) {
            this.code = code;
            this.expiry = LocalDateTime.now().plusMinutes(3); // 3분 만료
            this.verified = false;
        }
    }

    @PostConstruct
    public void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
    }

    /**
     * 보낼 메시지 생성 및 발송 후 저장
     * 
     * @param toNumber         수신번호
     * @param verificationCode 인증번호
     * @return 발송 성공 여부
     */
    public boolean sendVerificationCode(String toNumber, String verificationCode) {
        Message message = new Message();
        message.setFrom(fromNumber);
        message.setTo(toNumber);
        message.setText("[밴디콘] 인증번호 [" + verificationCode + "]를 입력해주세요.");

        try {
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));
            log.debug("SMS Sent Response: {}", response);

            if (response != null) {
                verificationStore.put(toNumber, new VerificationInfo(verificationCode));
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("SMS Sending Failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 인증번호 확인
     * 
     * @param phoneNumber 휴대폰 번호
     * @param code        입력된 인증번호
     * @return 인증 성공 여부
     */
    public boolean verifyCode(String phoneNumber, String code) {
        VerificationInfo info = verificationStore.get(phoneNumber);
        if (info != null && info.code.equals(code) && LocalDateTime.now().isBefore(info.expiry)) {
            info.verified = true;
            return true;
        }
        return false;
    }

    /**
     * 최종 인증 여부 확인 (회원가입 시)
     * 
     * @param phoneNumber 휴대폰 번호
     * @return 최종 인증 여부
     */
    public boolean isVerified(String phoneNumber) {
        VerificationInfo info = verificationStore.get(phoneNumber);
        return info != null && info.verified;
    }

    /**
     * 인증 정보 삭제 (가입 완료 후)
     * 
     * @param phoneNumber 휴대폰 번호
     */
    public void clearVerification(String phoneNumber) {
        verificationStore.remove(phoneNumber);
    }

    /**
     * 6자리 랜덤 인증번호 생성
     * 
     * @return 6자리 인증번호
     */
    public String generateVerificationCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
}
