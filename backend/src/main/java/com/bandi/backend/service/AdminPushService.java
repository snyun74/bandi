package com.bandi.backend.service;

import com.bandi.backend.dto.AdminDeviceStatsDto;
import com.bandi.backend.dto.AdminPushHistoryDto;
import com.bandi.backend.dto.AdminPushRequestDto;
import com.bandi.backend.repository.UserRepository;
import com.google.firebase.messaging.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPushService {

    @PersistenceContext
    private final EntityManager entityManager;
    private final UserRepository userRepository;

    @jakarta.annotation.PostConstruct
    @Transactional
    public void initTables() {
        try {
            ensureTablesExist();
        } catch (Exception e) {
            log.warn("Failed to initialize push tables: {}", e.getMessage());
        }
    }

    @Transactional
    public void ensureTablesExist() {
        try {
            String createDeviceTable = """
                CREATE TABLE IF NOT EXISTS MM_USER_DEVICE (
                    FCM_TOKEN VARCHAR(500) PRIMARY KEY,
                    USER_ID VARCHAR(50),
                    DEVICE_TYPE VARCHAR(20),
                    LAST_LOGIN_DTIME VARCHAR(14),
                    INS_DTIME VARCHAR(14),
                    UPD_DTIME VARCHAR(14)
                )
            """;
            entityManager.createNativeQuery(createDeviceTable).executeUpdate();

            String createLogTable = """
                CREATE TABLE IF NOT EXISTS MM_PUSH_LOG (
                    PUSH_LOG_NO BIGSERIAL PRIMARY KEY,
                    USER_ID VARCHAR(50),
                    PUSH_TITLE VARCHAR(200),
                    PUSH_BODY TEXT,
                    LINK_URL VARCHAR(500),
                    READ_YN VARCHAR(1) DEFAULT 'N',
                    SEND_STAT_CD VARCHAR(10) DEFAULT '00',
                    INS_DTIME VARCHAR(14),
                    UPD_DTIME VARCHAR(14)
                )
            """;
            entityManager.createNativeQuery(createLogTable).executeUpdate();
        } catch (Exception e) {
            log.error("Failed to ensure push tables exist: {}", e.getMessage());
        }
    }

    /**
     * 등록된 기기 및 사용자 수 통계 조회
     */
    public AdminDeviceStatsDto getDeviceStats() {
        ensureTablesExist();
        try {
            String sql = """
                SELECT 
                    COUNT(*) as total_devices,
                    COUNT(CASE WHEN UPPER(DEVICE_TYPE) IN ('ANDROID', 'APP') THEN 1 END) as android_count,
                    COUNT(CASE WHEN UPPER(DEVICE_TYPE) = 'IOS' THEN 1 END) as ios_count,
                    COUNT(CASE WHEN UPPER(DEVICE_TYPE) = 'WEB' THEN 1 END) as web_count,
                    COUNT(DISTINCT USER_ID) as total_users
                FROM MM_USER_DEVICE
            """;

            Object[] result = (Object[]) entityManager.createNativeQuery(sql).getSingleResult();

            return AdminDeviceStatsDto.builder()
                    .totalDeviceCount(result[0] != null ? ((Number) result[0]).longValue() : 0L)
                    .androidCount(result[1] != null ? ((Number) result[1]).longValue() : 0L)
                    .iosCount(result[2] != null ? ((Number) result[2]).longValue() : 0L)
                    .webCount(result[3] != null ? ((Number) result[3]).longValue() : 0L)
                    .totalUserCount(result[4] != null ? ((Number) result[4]).longValue() : 0L)
                    .build();
        } catch (Exception e) {
            log.error("Failed to fetch device stats: {}", e.getMessage());
            return AdminDeviceStatsDto.builder().build();
        }
    }

    /**
     * 관리자 푸시 발송 처리
     */
    @Transactional
    public Map<String, Object> sendAdminPush(AdminPushRequestDto dto) {
        String adminUserId = (dto.getAdminUserId() != null && !dto.getAdminUserId().isBlank()) 
                ? dto.getAdminUserId().trim() 
                : "admin";

        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new RuntimeException("푸시 제목을 입력해 주세요.");
        }
        if (dto.getBody() == null || dto.getBody().isBlank()) {
            throw new RuntimeException("푸시 내용을 입력해 주세요.");
        }

        String targetType = dto.getTargetType() != null ? dto.getTargetType().toUpperCase() : "INDIVIDUAL";
        String linkUrl = (dto.getLinkUrl() != null && !dto.getLinkUrl().isBlank()) ? dto.getLinkUrl() : "/main";

        // 2. 발송 대상 토큰 조회
        List<Object[]> deviceRows;
        if ("INDIVIDUAL".equals(targetType)) {
            if (dto.getTargetUserId() == null || dto.getTargetUserId().isBlank()) {
                throw new RuntimeException("개인 발송 대상 회원을 선택해 주세요.");
            }
            String sql = "SELECT FCM_TOKEN, USER_ID, DEVICE_TYPE FROM MM_USER_DEVICE WHERE USER_ID = :userId";
            deviceRows = entityManager.createNativeQuery(sql)
                    .setParameter("userId", dto.getTargetUserId().trim())
                    .getResultList();
        } else if ("ANDROID".equals(targetType)) {
            String sql = "SELECT FCM_TOKEN, USER_ID, DEVICE_TYPE FROM MM_USER_DEVICE WHERE UPPER(DEVICE_TYPE) IN ('ANDROID', 'APP')";
            deviceRows = entityManager.createNativeQuery(sql).getResultList();
        } else if ("IOS".equals(targetType)) {
            String sql = "SELECT FCM_TOKEN, USER_ID, DEVICE_TYPE FROM MM_USER_DEVICE WHERE UPPER(DEVICE_TYPE) = 'IOS'";
            deviceRows = entityManager.createNativeQuery(sql).getResultList();
        } else { // ALL
            String sql = "SELECT FCM_TOKEN, USER_ID, DEVICE_TYPE FROM MM_USER_DEVICE";
            deviceRows = entityManager.createNativeQuery(sql).getResultList();
        }

        if (deviceRows.isEmpty()) {
            String targetLabel = "INDIVIDUAL".equals(targetType) ? (dto.getTargetUserId() != null ? dto.getTargetUserId() : adminUserId)
                    : "ANDROID".equals(targetType) ? "안드로이드 전체"
                    : "IOS".equals(targetType) ? "애플(iOS) 전체"
                    : "전체 사용자";
            String logTitle = "[" + targetLabel + "] " + dto.getTitle();
            // 대상 기기가 없더라도 발송 시도 이력을 남겨 관리자가 확인할 수 있게 함
            savePushLog(adminUserId, logTitle, dto.getBody(), linkUrl, "02");

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("targetCount", 0);
            result.put("successCount", 0);
            result.put("failCount", 0);
            result.put("message", "발송 대상 기기(FCM 토큰)가 존재하지 않습니다. (이력 기록 완료)");
            return result;
        }

        // 3. 발송 처리 (사용자별 토큰 그룹핑)
        Map<String, List<String>> userTokenMap = new LinkedHashMap<>();
        for (Object[] row : deviceRows) {
            String token = (String) row[0];
            String uId = (String) row[1];
            if (token != null && !token.isBlank() && uId != null && !uId.isBlank()) {
                userTokenMap.computeIfAbsent(uId, k -> new ArrayList<>()).add(token);
            }
        }

        int targetUserCount = userTokenMap.size();
        int successCount = 0;
        int failCount = 0;

        for (Map.Entry<String, List<String>> entry : userTokenMap.entrySet()) {
            String recipientId = entry.getKey();
            List<String> tokens = entry.getValue();

            Long logNo = savePushLog(recipientId, dto.getTitle(), dto.getBody(), linkUrl, "00");
            boolean userSuccess = false;

            for (String token : tokens) {
                try {
                    Message message = Message.builder()
                            .setNotification(Notification.builder()
                                    .setTitle(dto.getTitle())
                                    .setBody(dto.getBody())
                                    .build())
                            .setToken(token)
                            .putData("click_action", linkUrl)
                            .putData("link", linkUrl)
                            .putData("logNo", logNo != null ? String.valueOf(logNo) : "")
                            .setAndroidConfig(AndroidConfig.builder()
                                    .setNotification(AndroidNotification.builder()
                                            .setTag("ADMIN_NOTICE")
                                            .build())
                                    .build())
                            .setApnsConfig(ApnsConfig.builder()
                                    .setAps(Aps.builder()
                                            .setThreadId("ADMIN_NOTICE")
                                            .build())
                                    .build())
                            .setWebpushConfig(WebpushConfig.builder()
                                    .setFcmOptions(WebpushFcmOptions.withLink(linkUrl))
                                    .build())
                            .build();

                    FirebaseMessaging.getInstance().send(message);
                    userSuccess = true;
                } catch (Exception e) {
                    log.warn("FCM push send failed for user={}, token={}: {}", recipientId, token, e.getMessage());
                }
            }

            if (logNo != null) {
                updatePushLogStat(logNo, userSuccess ? "01" : "02");
            }

            if (userSuccess) {
                successCount++;
            } else {
                failCount++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("targetCount", targetUserCount);
        result.put("tokenCount", deviceRows.size());
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("message", "푸시 알림 발송이 완료되었습니다. (대상: " + targetUserCount + "명, 성공: " + successCount + "명)");
        return result;
    }

    /**
     * 최근 푸시 발송 이력 목록 조회
     */
    public List<AdminPushHistoryDto> getPushHistory(int limit) {
        ensureTablesExist();
        try {
            int maxRows = limit > 0 ? limit : 30;
            String sql = """
                SELECT 
                    L.PUSH_LOG_NO,
                    L.USER_ID,
                    COALESCE(U.USER_NICK_NM, U.USER_NM, L.USER_ID, '') AS USER_NICK_NM,
                    COALESCE(U.USER_NM, '') AS USER_NM,
                    COALESCE(L.PUSH_TITLE, '') AS PUSH_TITLE,
                    COALESCE(L.PUSH_BODY, '') AS PUSH_BODY,
                    COALESCE(L.LINK_URL, '') AS LINK_URL,
                    COALESCE(L.SEND_STAT_CD, '00') AS SEND_STAT_CD,
                    COALESCE(L.READ_YN, 'N') AS READ_YN,
                    COALESCE(L.INS_DTIME, '') AS INS_DTIME
                FROM MM_PUSH_LOG L
                LEFT JOIN MM_USER U ON L.USER_ID = U.USER_ID
                ORDER BY L.PUSH_LOG_NO DESC
            """;

            List<?> rawList = entityManager.createNativeQuery(sql)
                    .setMaxResults(maxRows)
                    .getResultList();

            List<AdminPushHistoryDto> historyList = new ArrayList<>();
            for (Object item : rawList) {
                if (item instanceof Object[] row) {
                    historyList.add(AdminPushHistoryDto.builder()
                            .pushLogNo(row[0] != null ? ((Number) row[0]).longValue() : null)
                            .userId(row[1] != null ? String.valueOf(row[1]) : "")
                            .userNickNm(row[2] != null ? String.valueOf(row[2]) : "")
                            .userNm(row[3] != null ? String.valueOf(row[3]) : "")
                            .pushTitle(row[4] != null ? String.valueOf(row[4]) : "")
                            .pushBody(row[5] != null ? String.valueOf(row[5]) : "")
                            .linkUrl(row[6] != null ? String.valueOf(row[6]) : "")
                            .sendStatCd(row[7] != null ? String.valueOf(row[7]) : "00")
                            .readYn(row[8] != null ? String.valueOf(row[8]) : "N")
                            .insDtime(row[9] != null ? String.valueOf(row[9]) : "")
                            .build());
                }
            }
            log.info("Successfully fetched {} push history records", historyList.size());
            return historyList;
        } catch (Exception e) {
            log.error("Failed to fetch push history: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private Long savePushLog(String userId, String title, String body, String link, String stat) {
        try {
            String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String sql = """
                INSERT INTO MM_PUSH_LOG (USER_ID, PUSH_TITLE, PUSH_BODY, LINK_URL, READ_YN, SEND_STAT_CD, INS_DTIME)
                VALUES (:userId, :title, :body, :link, 'N', :stat, :now)
                RETURNING PUSH_LOG_NO
            """;
            Object result = entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId != null ? userId : "admin")
                    .setParameter("title", title)
                    .setParameter("body", body)
                    .setParameter("link", link)
                    .setParameter("stat", stat)
                    .setParameter("now", currentDateTime)
                    .getSingleResult();
            return ((Number) result).longValue();
        } catch (Exception e) {
            log.warn("Failed to save push log with RETURNING, attempting standard INSERT: {}", e.getMessage());
            try {
                String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                String fallbackSql = """
                    INSERT INTO MM_PUSH_LOG (USER_ID, PUSH_TITLE, PUSH_BODY, LINK_URL, READ_YN, SEND_STAT_CD, INS_DTIME)
                    VALUES (:userId, :title, :body, :link, 'N', :stat, :now)
                """;
                entityManager.createNativeQuery(fallbackSql)
                        .setParameter("userId", userId != null ? userId : "admin")
                        .setParameter("title", title)
                        .setParameter("body", body)
                        .setParameter("link", link)
                        .setParameter("stat", stat)
                        .setParameter("now", currentDateTime)
                        .executeUpdate();
            } catch (Exception ex) {
                log.error("Failed to insert push log fallback: {}", ex.getMessage());
            }
            return null;
        }
    }

    private void updatePushLogStat(Long logNo, String stat) {
        try {
            String sql = "UPDATE MM_PUSH_LOG SET SEND_STAT_CD = :stat WHERE PUSH_LOG_NO = :logNo";
            entityManager.createNativeQuery(sql)
                    .setParameter("stat", stat)
                    .setParameter("logNo", logNo)
                    .executeUpdate();
        } catch (Exception e) {
            log.warn("Failed to update push log status: {}", e.getMessage());
        }
    }
}
