package com.bandi.backend.service;

import com.bandi.backend.dto.AdminJamDto;
import com.bandi.backend.entity.band.BnGroup;
import com.bandi.backend.entity.band.BnSession;
import com.bandi.backend.repository.BnGroupRepository;
import com.bandi.backend.repository.BnSessionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminJamService {
    private final EntityManager entityManager;
    private final BnGroupRepository bnGroupRepository;
    private final BnSessionRepository bnSessionRepository;
    private final PushService pushService;

    public List<AdminJamDto> getAdminJamList(String searchKeyword, int page, int size) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                B.BN_NO, B.BN_TYPE, B.BN_NM, B.BN_SONG_NM, B.BN_SINGER_NM, B.BN_STAT_CD, B.BN_CONF_FG, C.CN_NM
            FROM BN_GROUP B
            LEFT JOIN CN_GROUP C ON B.CN_NO = C.CN_NO
            WHERE (B.BN_STAT_CD = 'A' OR B.BN_STAT_CD = 'D' OR B.BN_STAT_CD = 'F')
        """);

        if (searchKeyword != null && !searchKeyword.trim().isEmpty()) {
            sql.append(" AND (B.BN_NM LIKE :keyword OR B.BN_SONG_NM LIKE :keyword OR B.BN_SINGER_NM LIKE :keyword OR C.CN_NM LIKE :keyword)");
        }
        
        sql.append(" ORDER BY B.BN_NO DESC");

        Query query = entityManager.createNativeQuery(sql.toString());
        
        if (searchKeyword != null && !searchKeyword.trim().isEmpty()) {
            query.setParameter("keyword", "%" + searchKeyword.trim() + "%");
        }

        query.setFirstResult(page * size);
        query.setMaxResults(size);

        List<Object[]> results = query.getResultList();
        List<AdminJamDto> dtoList = new ArrayList<>();

        for (Object[] row : results) {
            String statCd = row[5] != null ? row[5].toString() : null;
            String confFg = row[6] != null ? row[6].toString() : null;
            String formattedStatus = "미확정";
            
            if ("D".equals(statCd) || "N".equals(statCd) || "DEL".equals(statCd)) {
                formattedStatus = "삭제";
            } else if ("F".equals(statCd)) {
                formattedStatus = "종료";
            } else if ("Y".equals(confFg)) {
                formattedStatus = "확정";
            } else if ("N".equals(confFg)) {
                formattedStatus = "미확정";
            }

            dtoList.add(AdminJamDto.builder()
                .bnNo(((Number) row[0]).longValue())
                .bnType(row[1] != null ? row[1].toString() : null)
                .bnNm(row[2] != null ? row[2].toString() : null)
                .bnSongNm(row[3] != null ? row[3].toString() : null)
                .bnSingerNm(row[4] != null ? row[4].toString() : null)
                .bnStatCd(statCd)
                .bnConfFg(confFg)
                .clanNm(row[7] != null ? row[7].toString() : null)
                .formattedStatus(formattedStatus)
                .build());
        }

        return dtoList;
    }

    @Transactional
    public void addSession(Long bnNo, String sessionTypeCd, String userId) {
        String currentDateTime = java.time.LocalDateTime.now()
            .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            
        BnSession session = new BnSession();
        session.setBnNo(bnNo);
        session.setBnSessionTypeCd(sessionTypeCd);
        // 빈 세션이면 joinUserId null
        session.setInsDtime(currentDateTime);
        session.setInsId(userId);
        session.setUpdDtime(currentDateTime);
        session.setUpdId(userId);
        bnSessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(Long bnNo, Long sessionNo) {
        bnSessionRepository.deleteById(sessionNo);
    }

    public List<BnSession> getSessionsByBnNo(Long bnNo) {
        return bnSessionRepository.findByBnNo(bnNo);
    }

    @Transactional
    public void sendPushToJam(Long bnNo, String pushMessage, String adminUserId) {
        String adminNickNm = "관리자";
        try {
            Query q = entityManager.createNativeQuery("SELECT user_nick_nm FROM MM_USER WHERE LOWER(user_id) = 'snyun'");
            Object result = q.getSingleResult();
            if (result != null) {
                adminNickNm = (String) result;
            }
        } catch (Exception e) {
            // ignore
        }

        // Send push to all participants (BN_SESSION) in the jam
        List<BnSession> sessions = bnSessionRepository.findByBnNo(bnNo);
        
        for (BnSession session : sessions) {
            if (session.getBnSessionJoinUserId() != null) {
                pushService.sendPush(session.getBnSessionJoinUserId(), adminNickNm, pushMessage, "/main/jam/chat/" + bnNo, "SN", "BN_" + bnNo);
            }
        }
    }
}
