package com.bandi.backend.repository;

import com.bandi.backend.dto.ClanListDto;
import com.bandi.backend.dto.ClanMemberProjection;
import com.bandi.backend.entity.clan.ClanGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanGroupRepository extends JpaRepository<ClanGroup, Long> {

        @Query(value = "SELECT new com.bandi.backend.dto.AdminClanApprovalDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, g.attachNo, a.filePath, g.cnApprStatCd, g.insDtime) " +
                        "FROM ClanGroup g " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "ORDER BY g.cnNo DESC")
        List<com.bandi.backend.dto.AdminClanApprovalDto> findAllAdminClans();

        @Query(value = "SELECT new com.bandi.backend.dto.ClanListDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, " +
                        "(SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN'), "
                        +
                        "a.filePath, 0L) " +
                        "FROM ClanGroup g " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "WHERE g.cnApprStatCd = 'CN' " +
                        "AND g.cnStatCd = 'A' " +
                        "ORDER BY g.insDtime DESC")
        List<ClanListDto> findAllActiveClans();

        @Query(value = "SELECT new com.bandi.backend.dto.ClanListDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, " +
                        "(SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN'), "
                        +
                        "a.filePath, 0L) " +
                        "FROM ClanGroup g " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "WHERE g.cnNm LIKE CONCAT('%', :cnNm, '%') " +
                        "AND g.cnApprStatCd = 'CN' " +
                        "AND g.cnStatCd = 'A' " +
                        "ORDER BY g.insDtime DESC")
        List<ClanListDto> findActiveClansByName(@org.springframework.data.repository.query.Param("cnNm") String cnNm);

        @Query(value = "SELECT new com.bandi.backend.dto.ClanListDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, " +
                        "(SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN'), "
                        +
                        "a.filePath, 0L) " +
                        "FROM ClanGroup g " +
                        "JOIN ClanUser u ON u.cnNo = g.cnNo " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "WHERE g.cnApprStatCd = 'CN' " +
                        "AND g.cnStatCd = 'A' " +
                        "AND u.cnUserId = :userId " +
                        "AND u.cnUserStatCd = 'A' " +
                        "AND u.cnUserApprStatCd = 'CN' " +
                        "ORDER BY (SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN') DESC")
        List<ClanListDto> findMyClan(@org.springframework.data.repository.query.Param("userId") String userId,
                        org.springframework.data.domain.Pageable pageable);

        @Query(value = "SELECT new com.bandi.backend.dto.ClanListDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, " +
                        "(SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN'), "
                        +
                        "a.filePath, 0L) " +
                        "FROM ClanGroup g " +
                        "JOIN ClanUser u ON u.cnNo = g.cnNo " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "WHERE g.cnApprStatCd = 'CN' " +
                        "AND g.cnStatCd = 'A' " +
                        "AND u.cnUserId = :userId " +
                        "AND u.cnUserStatCd = 'A' " +
                        "AND u.cnUserApprStatCd = 'CN' " +
                        "ORDER BY (SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN') DESC")
        List<ClanListDto> findAllMyClans(@org.springframework.data.repository.query.Param("userId") String userId);

        @Query(value = "SELECT new com.bandi.backend.dto.ClanListDto(" +
                        "g.cnNo, g.cnNm, g.cnDesc, g.cnUrl, " +
                        "(SELECT count(u) FROM ClanUser u WHERE u.cnNo = g.cnNo AND u.cnUserStatCd = 'A' AND u.cnUserApprStatCd = 'CN'), "
                        +
                        "a.filePath, " +
                        "(SELECT COUNT(m) FROM ClanChatMessage m " +
                        "  WHERE m.cnNo = g.cnNo " +
                        "  AND m.sndUserId <> :userId " +
                        "  AND NOT EXISTS (SELECT r FROM ClanChatMessageRead r WHERE r.cnMsgNo = m.cnMsgNo AND r.readUserId = :userId)) "
                        +
                        ") " +
                        "FROM ClanGroup g " +
                        "LEFT JOIN CmAttachment a ON g.attachNo = a.attachNo " +
                        "WHERE g.cnNo = :clanId")
        java.util.Optional<ClanListDto> findClanDetail(
                        @org.springframework.data.repository.query.Param("clanId") Long clanId,
                        @org.springframework.data.repository.query.Param("userId") String userId);

        @Query(value = "SELECT " +
                        "    CN.CN_NO AS cnNo " +
                        "    , CN.CN_USER_ID AS cnUserId " +
                        "    , CN.CN_USER_ROLE_CD AS cnUserRoleCd " +
                        "    , CN.CN_USER_APPR_STAT_CD AS cnUserApprStatCd " +
                        "    , CASE " +
                        "        WHEN CN.CN_USER_APPR_STAT_CD = 'RQ' THEN 1 " +
                        "        ELSE 2 " +
                        "      END AS ordBy " +
                        "    , MM.USER_NM AS userNm " +
                        "    , MM.USER_NICK_NM AS userNickNm " +
                        "FROM " +
                        "    CN_USER CN " +
                        "INNER JOIN " +
                        "    MM_USER MM ON MM.USER_ID = CN.CN_USER_ID " +
                        "WHERE " +
                        "    CN.CN_NO = :clanId " +
                        "    AND CN.CN_USER_STAT_CD = 'A' " +
                        "    AND CN.CN_USER_APPR_STAT_CD IN ('RQ', 'CN') " +
                        "    AND MM.USER_STAT_CD = 'A' " +
                        "ORDER BY " +
                        "    ordBy, CN.CN_USER_ROLE_CD", nativeQuery = true)
        List<ClanMemberProjection> findClanMembers(@Param("clanId") Long clanId);

        @Query("SELECT new com.bandi.backend.dto.MemberSessionDto(" +
                        "s.bnSessionJoinUserId, g.bnSongNm, g.bnSingerNm, '', s.bnSessionTypeCd) " +
                        "FROM BnSession s " +
                        "JOIN BnGroup g ON s.bnNo = g.bnNo " +
                        "WHERE g.cnNo = :clanId " +
                        "AND g.bnStatCd = 'A' " +
                        "AND g.bnConfFg IN ('N', 'Y') " +
                        "AND s.bnSessionJoinUserId IS NOT NULL")
        List<com.bandi.backend.dto.MemberSessionDto> findAllMemberSessions(@Param("clanId") Long clanId);
}
