package com.bandi.backend.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushFcmOptions;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PushService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void saveToken(String userId, String token, String deviceType) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 유저가 보내준 DDL 확인: PK가 FCM_TOKEN 임
        String sql = """
                INSERT INTO MM_USER_DEVICE (FCM_TOKEN, USER_ID, DEVICE_TYPE, LAST_LOGIN_DTIME, INS_DTIME, UPD_DTIME)
                VALUES (:token, :userId, :deviceType, :now, :now, :now)
                ON CONFLICT (FCM_TOKEN) DO UPDATE
                SET USER_ID = :userId,
                    DEVICE_TYPE = :deviceType,
                    LAST_LOGIN_DTIME = :now,
                    UPD_DTIME = :now
                """;

        entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .setParameter("deviceType", deviceType)
                .setParameter("token", token)
                .setParameter("now", currentDateTime)
                .executeUpdate();
    }

    @Async
    @Transactional
    public void sendPush(String userId, String title, String body, String link, String pushType) {
        // 1. 수신 설정 확인 (MM_USER_PUSH_SETTING)
        if (!isPushEnabled(userId, pushType)) {
            System.out.println("DEBUG: Push disabled for user=" + userId + ", type=" + pushType);
            return;
        }

        // 2. MM_USER_DEVICE에서 해당 사용자의 토큰 조회
        String sql = "SELECT FCM_TOKEN FROM MM_USER_DEVICE WHERE USER_ID = :userId";
        @SuppressWarnings("unchecked")
        java.util.List<String> tokens = entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .getResultList();

        // 3. 알림 발송 전 로그 먼저 생성 (사용자당 1건만 생성)
        Long logNo = savePushLog(userId, title, body, link, "00"); // 00:발송시도
        if (logNo == null)
            return;

        boolean isAnySuccess = false;

        for (String token : tokens) {
            try {
                Message message = Message.builder()
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setToken(token)
                        .putData("click_action", link)
                        .putData("logNo", String.valueOf(logNo))
                        .setWebpushConfig(WebpushConfig.builder()
                                .setFcmOptions(WebpushFcmOptions.withLink(link))
                                .build())
                        .build();

                FirebaseMessaging.getInstance().send(message);
                isAnySuccess = true;
            } catch (Exception e) {
                System.err.println("ERROR: FCM send failed for token: " + token);
                System.err.println("Cause: " + e.getMessage());
                // 개별 토큰 실패는 로그에만 남기고 계속 진행
            }
        }

        // 4. 결과 업데이트 (하나라도 성공했다면 01, 모두 실패했다면 02)
        if (isAnySuccess) {
            updatePushLogStat(logNo, "01");
        } else {
            updatePushLogStat(logNo, "02");
        }
    }

    @Transactional
    public void updateReadStatus(Long pushLogNo) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String sql = "UPDATE MM_PUSH_LOG SET READ_YN = 'Y', UPD_DTIME = :now WHERE PUSH_LOG_NO = :logNo";
        entityManager.createNativeQuery(sql)
                .setParameter("logNo", pushLogNo)
                .setParameter("now", currentDateTime)
                .executeUpdate();
    }

    private void updatePushLogStat(Long logNo, String stat) {
        try {
            String sql = "UPDATE MM_PUSH_LOG SET SEND_STAT_CD = :stat WHERE PUSH_LOG_NO = :logNo";
            entityManager.createNativeQuery(sql)
                    .setParameter("stat", stat)
                    .setParameter("logNo", logNo)
                    .executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private boolean isPushEnabled(String userId, String pushType) {
        try {
            String sql = "SELECT USE_YN FROM MM_USER_PUSH_SETTING WHERE USER_ID = :userId AND PUSH_TYPE_CD = :pushType";
            Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .setParameter("pushType", pushType)
                    .getSingleResult();
            return "Y".equals(result);
        } catch (Exception e) {
            // 설정이 없으면 기본적으로 수신한다고 가정(Y)하거나 정책에 따라 변경 가능
            return true;
        }
    }

    private Long savePushLog(String userId, String title, String body, String link, String stat) {
        try {
            String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            // DDL 기준 컬럼명: USER_ID, PUSH_TITLE, PUSH_BODY, LINK_URL, READ_YN, SEND_STAT_CD,
            // INS_DTIME
            // BIGSERIAL인 PUSH_LOG_NO를 사용하기 위해 NativeQuery로 ID를 가져옵니다.
            String sql = """
                    INSERT INTO MM_PUSH_LOG (USER_ID, PUSH_TITLE, PUSH_BODY, LINK_URL, READ_YN, SEND_STAT_CD, INS_DTIME)
                    VALUES (:userId, :title, :body, :link, 'N', :stat, :now)
                    RETURNING PUSH_LOG_NO
                    """;
            Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .setParameter("title", title)
                    .setParameter("body", body)
                    .setParameter("link", link)
                    .setParameter("stat", stat)
                    .setParameter("now", currentDateTime)
                    .getSingleResult();
            return ((Number) result).longValue();
        } catch (Exception e) {
            System.err.println("WARNING: Failed to save push log to MM_PUSH_LOG. Check if table schema matches.");
            e.printStackTrace();
            return null;
        }
    }
}
