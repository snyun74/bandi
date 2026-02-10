package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoard;
import com.bandi.backend.dto.HotBoardPostDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanBoardRepository extends JpaRepository<ClanBoard, Long> {

        @Query(value = "SELECT " +
                        "    K.CN_NO AS \"cnNo\", " +
                        "    K.CN_BOARD_TYPE_NO AS \"cnBoardTypeNo\", " +
                        "    B.CN_BOARD_NO AS \"cnBoardNo\", " +
                        "    B.TITLE AS \"title\", " +
                        "    B.INS_DTIME AS \"regDate\", " +
                        "    (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B.WRITER_USER_ID) AS \"userNickNm\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B.CN_BOARD_NO) AS \"boardLikeCnt\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') AS \"boardReplyCnt\" "
                        +
                        "FROM CN_BOARD_TYPE K " +
                        "INNER JOIN CN_BOARD B ON B.CN_BOARD_TYPE_NO = K.CN_BOARD_TYPE_NO " +
                        "WHERE K.CN_NO = :clanId " +
                        "  AND K.BOARD_TYPE_STAT_CD = 'A' " +
                        "  AND B.BOARD_STAT_CD = 'A' " +
                        "  AND B.INS_DTIME >= TO_CHAR(NOW() - INTERVAL '7 days', 'YYYYMMDD') || '000000' " +
                        "ORDER BY \"boardLikeCnt\" DESC " +
                        "LIMIT 5", nativeQuery = true)
        List<HotBoardPostDto> findHotBoardPosts(@Param("clanId") Long clanId);

        @Query(value = "SELECT " +
                        "    K.CN_NO AS \"cnNo\", " +
                        "    K.CN_BOARD_TYPE_NO AS \"cnBoardTypeNo\", " +
                        "    B.CN_BOARD_NO AS \"cnBoardNo\", " +
                        "    B.TITLE AS \"title\", " +
                        "    B.INS_DTIME AS \"regDate\", " +
                        "    (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B.WRITER_USER_ID) AS \"userNickNm\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B.CN_BOARD_NO) AS \"boardLikeCnt\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') AS \"boardReplyCnt\" "
                        +
                        "FROM CN_BOARD_TYPE K " +
                        "INNER JOIN CN_BOARD B ON B.CN_BOARD_TYPE_NO = K.CN_BOARD_TYPE_NO " +
                        "WHERE K.CN_NO = :clanId " +
                        "  AND K.BOARD_TYPE_STAT_CD = 'A' " +
                        "  AND B.BOARD_STAT_CD = 'A' " +
                        "  AND B.INS_DTIME >= TO_CHAR(NOW() - INTERVAL '31 days', 'YYYYMMDD') || '000000' " +
                        "ORDER BY \"boardLikeCnt\" DESC " +
                        "LIMIT 3", nativeQuery = true)
        List<HotBoardPostDto> findTopBoardPosts(@Param("clanId") Long clanId);

        @Query(value = "SELECT " +
                        "    B.CN_BOARD_NO AS \"cnBoardNo\", " +
                        "    B.TITLE AS \"title\", " +
                        "    B.INS_DTIME AS \"regDate\", " +
                        "    (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B.WRITER_USER_ID) AS \"userNickNm\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B.CN_BOARD_NO) AS \"boardLikeCnt\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') AS \"boardReplyCnt\" "
                        +
                        "FROM CN_BOARD B " +
                        "WHERE B.CN_BOARD_TYPE_NO = :boardTypeNo " +
                        "  AND B.BOARD_STAT_CD = 'A' " +
                        "  AND (:keyword IS NULL OR :keyword = '' OR B.TITLE LIKE '%' || :keyword || '%') " +
                        "ORDER BY B.INS_DTIME DESC", nativeQuery = true)
        List<com.bandi.backend.dto.BoardPostDto> findPostsByBoardType(@Param("boardTypeNo") Long boardTypeNo,
                        @Param("keyword") String keyword);

        @Query(value = "SELECT " +
                        "    B.CN_BOARD_NO AS \"cnBoardNo\", " +
                        "    B.TITLE AS \"title\", " +
                        "    B.CONTENT AS \"content\", " +
                        "    B.WRITER_USER_ID AS \"writerUserId\", " +
                        "    B.INS_DTIME AS \"regDate\", " +
                        "    B.YOUTUBE_URL AS \"youtubeUrl\", " +
                        "    0 AS \"viewCnt\", " +
                        "    COALESCE((SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B.WRITER_USER_ID), B.WRITER_USER_ID) AS \"userNickNm\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B.CN_BOARD_NO) AS \"boardLikeCnt\", "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') AS \"boardReplyCnt\" "
                        +
                        "FROM CN_BOARD B " +
                        "WHERE B.CN_BOARD_NO = :boardNo", nativeQuery = true)
        java.util.Map<String, Object> findBoardDetailMap(@Param("boardNo") Long boardNo);
}
