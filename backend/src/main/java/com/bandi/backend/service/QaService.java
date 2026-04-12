package com.bandi.backend.service;

import com.bandi.backend.dto.QaRequestDto;
import com.bandi.backend.dto.QaResponseDto;
import com.bandi.backend.entity.member.MmQa;
import com.bandi.backend.repository.MmQaRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class QaService {

    private final MmQaRepository qaRepository;
    private final UserRepository userRepository;
    private final PushService pushService;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Long createQa(QaRequestDto requestDto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String today = currentDateTime.substring(0, 8);

        MmQa qa = new MmQa();
        qa.setUserId(requestDto.getUserId());
        qa.setCrdDate(today);
        qa.setTitle(requestDto.getTitle());
        qa.setContent(requestDto.getContent());
        qa.setParentQaNo(requestDto.getParentQaNo());
        qa.setQaStatCd("A"); // Active or Received status
        qa.setAttachNo(requestDto.getAttachNo());
        qa.setInsDtime(currentDateTime);
        qa.setInsId(requestDto.getUserId());
        qa.setUpdDtime(currentDateTime);
        qa.setUpdId(requestDto.getUserId());

        MmQa savedQa = qaRepository.save(qa);

        // Notify admins if it's a new inquiry (no parentQaNo)
        if (requestDto.getParentQaNo() == null) {
            try {
                String userNickNm = userRepository.findById(requestDto.getUserId())
                        .map(u -> (u.getUserNickNm() != null && !u.getUserNickNm().isEmpty()) ? u.getUserNickNm() : u.getUserNm())
                        .orElse(requestDto.getUserId());

                java.util.List<com.bandi.backend.entity.member.User> admins = userRepository.findByAdminYn("Y");
                for (com.bandi.backend.entity.member.User admin : admins) {
                    pushService.sendPush(
                            admin.getUserId(),
                            userNickNm,
                            "고객센터 문의 요청이 왔습니다.",
                            "/main/admin/customer-center", // Assuming admin path
                            "ADMIN_QA_REQUEST"
                    );
                }
            } catch (Exception e) {
                log.error("Failed to send admin push notification for QA: {}", e.getMessage());
            }
        } else {
            // Notify inquirer if it's an answer (parentQaNo is not null)
            try {
                qaRepository.findById(requestDto.getParentQaNo()).ifPresent(parentQa -> {
                    String recipientId = parentQa.getUserId();
                    
                    // Sender info (Fixed to snyun)
                    String senderNickNm = userRepository.findById("snyun")
                            .map(u -> (u.getUserNickNm() != null && !u.getUserNickNm().isEmpty()) ? u.getUserNickNm() : u.getUserNm())
                            .orElse("관리자");

                    pushService.sendPush(
                            recipientId,
                            senderNickNm,
                            "고객센터 문의에 대한 답변이 등록되었습니다.",
                            "/main/customer-center",
                            "USER_QA_ANSWER"
                    );
                });
            } catch (Exception e) {
                log.error("Failed to send user push notification for QA answer: {}", e.getMessage());
            }
        }

        return savedQa.getQaNo();
    }

    public List<QaResponseDto> getUserQas(String userId) {
        String sql = """
                    SELECT
                        Q.QA_NO,
                        Q.USER_ID,
                        U.USER_NICK_NM,
                        Q.CRD_DATE,
                        Q.TITLE,
                        Q.CONTENT,
                        Q.PARENT_QA_NO,
                        Q.QA_STAT_CD,
                        Q.INS_DTIME,
                        (SELECT COUNT(1) FROM MM_QA A WHERE A.PARENT_QA_NO = Q.QA_NO) AS ANSWER_CNT
                    FROM MM_QA Q
                    LEFT JOIN MM_USER U ON U.USER_ID = Q.USER_ID
                    WHERE Q.USER_ID = :userId
                      AND Q.PARENT_QA_NO IS NULL
                      AND Q.CRD_DATE >= :oneMonthAgo
                    ORDER BY Q.CRD_DATE DESC, Q.QA_NO DESC
                """;

        String oneMonthAgo = LocalDateTime.now().minusMonths(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("userId", userId);
        query.setParameter("oneMonthAgo", oneMonthAgo);

        return mapToDtos(query.getResultList());
    }

    public List<QaResponseDto> getAllAdminQasPaged(int page, int size, String filter) {
        StringBuilder sql = new StringBuilder("""
                    SELECT
                        Q.QA_NO,
                        Q.USER_ID,
                        U.USER_NICK_NM,
                        Q.CRD_DATE,
                        Q.TITLE,
                        Q.CONTENT,
                        Q.PARENT_QA_NO,
                        Q.QA_STAT_CD,
                        Q.INS_DTIME,
                        (SELECT COUNT(1) FROM MM_QA A WHERE A.PARENT_QA_NO = Q.QA_NO) AS ANSWER_CNT
                    FROM MM_QA Q
                    LEFT JOIN MM_USER U ON U.USER_ID = Q.USER_ID
                    WHERE Q.PARENT_QA_NO IS NULL
                """);

        if ("WAITING".equals(filter)) {
            sql.append(" AND (SELECT COUNT(1) FROM MM_QA A WHERE A.PARENT_QA_NO = Q.QA_NO) = 0 ");
        } else if ("COMPLETED".equals(filter)) {
            sql.append(" AND (SELECT COUNT(1) FROM MM_QA A WHERE A.PARENT_QA_NO = Q.QA_NO) > 0 ");
        }

        sql.append(" ORDER BY Q.CRD_DATE DESC, Q.INS_DTIME DESC ");
        sql.append(" LIMIT :limit OFFSET :offset ");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("limit", size);
        query.setParameter("offset", page * size);

        return mapToDtos(query.getResultList());
    }

    public List<QaResponseDto> getAllAdminQas() {
        return getAllAdminQasPaged(0, 1000, "ALL");
    }

    private List<QaResponseDto> mapToDtos(List<Object[]> results) {
        List<QaResponseDto> dtos = new ArrayList<>();

        for (Object[] row : results) {
            Long qaNo = ((Number) row[0]).longValue();
            int answerCnt = ((Number) row[9]).intValue();

            QaResponseDto dto = QaResponseDto.builder()
                    .qaNo(qaNo)
                    .userId((String) row[1])
                    .userNickNm((String) row[2])
                    .crdDate((String) row[3])
                    .title((String) row[4])
                    .content((String) row[5])
                    .parentQaNo(row[6] != null ? ((Number) row[6]).longValue() : null)
                    .qaStatCd((String) row[7])
                    .insDtime((String) row[8])
                    .hasAnswer(answerCnt > 0)
                    .likeCount(0)
                    .commentCount(answerCnt)
                    .comments(new ArrayList<>())
                    .build();
            dtos.add(dto);
        }

        return dtos;
    }

    public List<QaResponseDto> getQaAnswers(Long qaNo) {
        String sql = """
                    SELECT
                        Q.QA_NO,
                        Q.USER_ID,
                        U.USER_NICK_NM,
                        Q.CRD_DATE,
                        Q.TITLE,
                        Q.CONTENT,
                        Q.PARENT_QA_NO,
                        Q.QA_STAT_CD,
                        Q.INS_DTIME
                    FROM MM_QA Q
                    LEFT JOIN MM_USER U ON U.USER_ID = Q.USER_ID
                    WHERE Q.PARENT_QA_NO = :qaNo
                    ORDER BY Q.QA_NO ASC
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("qaNo", qaNo);

        List<Object[]> results = query.getResultList();
        List<QaResponseDto> dtos = new ArrayList<>();

        for (Object[] row : results) {
            Long rowQaNo = ((Number) row[0]).longValue();

            QaResponseDto dto = QaResponseDto.builder()
                    .qaNo(rowQaNo)
                    .userId((String) row[1])
                    .userNickNm((String) row[2])
                    .crdDate((String) row[3])
                    .title((String) row[4])
                    .content((String) row[5])
                    .parentQaNo(row[6] != null ? ((Number) row[6]).longValue() : null)
                    .qaStatCd((String) row[7])
                    .insDtime((String) row[8])
                    .hasAnswer(false)
                    .likeCount(0)
                    .commentCount(0)
                    .comments(new ArrayList<>())
                    .build();
            dtos.add(dto);
        }

        return dtos;
    }

    public long countUnansweredQas() {
        return qaRepository.countUnansweredQas();
    }
}
