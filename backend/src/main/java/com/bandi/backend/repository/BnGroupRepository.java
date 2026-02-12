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
            "FROM    BN_USER U " +
            "JOIN    BN_GROUP G ON G.BN_NO = U.BN_NO " +
            "WHERE   U.BN_USER_ID = :userId " +
            "    AND U.BN_USER_STAT_CD = 'A' " +
            "    AND G.BN_STAT_CD = 'A' " +
            "    AND G.BN_CONF_FG IN ('N','Y')", nativeQuery = true)
    List<MyJamProjection> findMyJams(@Param("userId") String userId);
}
