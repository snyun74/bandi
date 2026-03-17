package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.bandi.backend.repository.projection.MyJamProjection;
import java.util.List;

public interface BnGroupRepository extends JpaRepository<BnGroup, Long> {

    @Query(value = "SELECT  G.BN_NO AS bnNo " +
            "    ,   COALESCE(MAX(U.BN_ROLE_CD), 'NORL') AS bnRoleCd " +
            "    ,   G.BN_TYPE AS bnType " +
            "    ,   G.CN_NO AS cnNo " +
            "    ,   G.BN_NM AS bnNm " +
            "    ,   G.BN_SONG_NM AS bnSongNm " +
            "    ,   G.BN_SINGER_NM AS bnSingerNm " +
            "    ,   G.BN_CONF_FG AS bnConfFg " +
            "    ,   G.BN_PASSWD_FG AS bnPasswdFg " +
            "    ,   (SELECT STRING_AGG(PNM, ', ') FROM ( " +
            "           SELECT CD.COMM_DETAIL_NM AS PNM FROM BN_SESSION S2 JOIN CM_COMM_DETAIL CD ON CD.COMM_CD = 'BD100' AND CD.COMM_DETAIL_CD = S2.BN_SESSION_TYPE_CD WHERE S2.BN_NO = G.BN_NO AND S2.BN_SESSION_JOIN_USER_ID = :userId " +
            "           UNION ALL " +
            "           SELECT CD.COMM_DETAIL_NM || '(예약)' AS PNM FROM BN_RSV_SESSION R2 JOIN CM_COMM_DETAIL CD ON CD.COMM_CD = 'BD100' AND CD.COMM_DETAIL_CD = R2.BN_SESSION_TYPE_CD WHERE R2.BN_NO = G.BN_NO AND R2.BN_SESSION_RSV_USER_ID = :userId " +
            "        ) P) AS bnPart " +
            "    ,   MAX(A.FILE_PATH) AS \"bnImg\" " +
            "FROM    BN_GROUP G " +
            "LEFT JOIN BN_USER U ON U.BN_NO = G.BN_NO AND U.BN_USER_ID = :userId AND U.BN_USER_STAT_CD = 'A' " +
            "LEFT JOIN BN_RSV_SESSION R ON R.BN_NO = G.BN_NO AND R.BN_SESSION_RSV_USER_ID = :userId " +
            "LEFT JOIN CM_ATTACHMENT A ON A.ATTACH_NO = G.ATTACH_NO " +
            "WHERE   G.BN_STAT_CD = 'A' " +
            "    AND G.BN_CONF_FG IN ('N','Y') " +
            "    AND (U.BN_USER_ID IS NOT NULL OR R.BN_SESSION_RSV_USER_ID IS NOT NULL) " +
            "    AND ( " +
            "        G.BN_TYPE <> 'CLAN' OR EXISTS ( " +
            "            SELECT 1 FROM CN_GROUP CG " +
            "            JOIN CN_USER CU ON CU.CN_NO = CG.CN_NO " +
            "            WHERE CG.CN_NO = G.CN_NO " +
            "              AND CG.CN_STAT_CD = 'A' " +
            "              AND CG.CN_APPR_STAT_CD = 'CN' " +
            "              AND CU.CN_USER_ID = :userId " +
            "              AND CU.CN_USER_STAT_CD = 'A' " +
            "              AND CU.CN_USER_APPR_STAT_CD = 'CN' " +
            "        ) " +
            "    ) " +
            "GROUP BY G.BN_NO, G.BN_TYPE, G.CN_NO, G.BN_NM, G.BN_SONG_NM, G.BN_SINGER_NM, G.BN_CONF_FG, G.BN_PASSWD_FG", nativeQuery = true)
    List<MyJamProjection> findMyJams(@Param("userId") String userId);
}
