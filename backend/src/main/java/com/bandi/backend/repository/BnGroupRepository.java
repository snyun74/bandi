package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.bandi.backend.repository.projection.MyJamProjection;
import java.util.List;

public interface BnGroupRepository extends JpaRepository<BnGroup, Long> {

    @Query(value = "SELECT  U.BN_NO AS bnNo " +
            "    ,   U.BN_ROLE_CD AS bnRoleCd " +
            "    ,   G.BN_TYPE AS bnType " +
            "    ,   G.CN_NO AS cnNo " +
            "    ,   G.BN_NM AS bnNm " +
            "    ,   G.BN_SONG_NM AS bnSongNm " +
            "    ,   G.BN_SINGER_NM AS bnSingerNm " +
            "    ,   G.BN_CONF_FG AS bnConfFg " +
            "    ,   G.BN_PASSWD_FG AS bnPasswdFg " +
            "    ,   STRING_AGG(COALESCE(CD.COMM_DETAIL_NM, '대기'), ', ') AS bnPart " +
            "    ,   MAX(A.FILE_PATH) AS \"bnImg\" " +
            "FROM    BN_USER U " +
            "JOIN    BN_GROUP G ON G.BN_NO = U.BN_NO " +
            "LEFT JOIN BN_SESSION S ON S.BN_NO = U.BN_NO AND S.BN_SESSION_JOIN_USER_ID = U.BN_USER_ID " +
            "LEFT JOIN CM_COMM_DETAIL CD ON CD.COMM_CD = 'BD100' AND CD.COMM_DETAIL_CD = S.BN_SESSION_TYPE_CD " +
            "LEFT JOIN CM_ATTACHMENT A ON A.ATTACH_NO = G.ATTACH_NO " +
            "WHERE   U.BN_USER_ID = :userId " +
            "    AND U.BN_USER_STAT_CD = 'A' " +
            "    AND G.BN_STAT_CD = 'A' " +
            "    AND G.BN_CONF_FG IN ('N','Y', 'E') " +
            "GROUP BY U.BN_NO, U.BN_ROLE_CD, G.BN_TYPE, G.CN_NO, G.BN_NM, G.BN_SONG_NM, G.BN_SINGER_NM, G.BN_CONF_FG, G.BN_PASSWD_FG", nativeQuery = true)
    List<MyJamProjection> findMyJams(@Param("userId") String userId);
}
