package com.bandi.backend.repository;

import com.bandi.backend.entity.member.CmScrap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface CmScrapRepository extends JpaRepository<CmScrap, Long> {
        long countByScrapTableNmAndScrapTablePkNo(String scrapTableNm, Long scrapTablePkNo);

        boolean existsByUserIdAndScrapTableNmAndScrapTablePkNo(String userId, String scrapTableNm, Long scrapTablePkNo);

        void deleteByUserIdAndScrapTableNmAndScrapTablePkNo(String userId, String scrapTableNm, Long scrapTablePkNo);

        // 내가 쓴 글 통합 조회 (CM_BOARD + CN_NOTICE + CN_BOARD)
        @Query(value = "SELECT * FROM ( " +
                        "  SELECT 'CM_BOARD' AS post_type, B.BOARD_NO AS pk_no, B.BOARD_TYPE_FG AS param1, CAST(NULL AS VARCHAR) AS param2, B.TITLE AS title, "
                        +
                        "    (SELECT COUNT(1) FROM CM_BOARD_LIKE L WHERE L.BOARD_NO = B.BOARD_NO) AS like_cnt, " +
                        "    (SELECT COUNT(1) FROM CM_BOARD_DETAIL D WHERE D.BOARD_NO = B.BOARD_NO AND D.REPLY_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    B.INS_DTIME AS reg_date " +
                        "  FROM CM_BOARD B WHERE B.WRITER_USER_ID = :userId " +
                        "  UNION ALL " +
                        "  SELECT 'CN_NOTICE' AS post_type, N.CN_NOTICE_NO AS pk_no, CAST(N.CN_NO AS VARCHAR) AS param1, CAST(NULL AS VARCHAR) AS param2, N.TITLE AS title, "
                        +
                        "    CAST(0 AS BIGINT) AS like_cnt, " +
                        "    (SELECT COUNT(1) FROM CN_NOTICE_DETAIL D WHERE D.CN_NOTICE_NO = N.CN_NOTICE_NO AND D.COMMENT_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    N.INS_DTIME AS reg_date " +
                        "  FROM CN_NOTICE N WHERE N.WRITER_USER_ID = :userId " +
                        "  UNION ALL " +
                        "  SELECT 'CN_BOARD' AS post_type, B2.CN_BOARD_NO AS pk_no, CAST((SELECT T.CN_NO FROM CN_BOARD_TYPE T WHERE T.CN_BOARD_TYPE_NO = B2.CN_BOARD_TYPE_NO) AS VARCHAR) AS param1, CAST(B2.CN_BOARD_TYPE_NO AS VARCHAR) AS param2, B2.TITLE AS title, "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B2.CN_BOARD_NO) AS like_cnt, "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B2.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    B2.INS_DTIME AS reg_date " +
                        "  FROM CN_BOARD B2 WHERE B2.WRITER_USER_ID = :userId " +
                        ") T ORDER BY T.reg_date DESC LIMIT :size OFFSET :offset", nativeQuery = true)
        List<Map<String, Object>> findMyPosts(@Param("userId") String userId,
                        @Param("size") int size,
                        @Param("offset") int offset);

        // 내가 댓글 쓴 글 통합 조회 (CM_BOARD + CN_NOTICE + CN_BOARD)
        @Query(value = "SELECT * FROM ( " +
                        "  SELECT DISTINCT 'CM_BOARD' AS post_type, B.BOARD_NO AS pk_no, B.BOARD_TYPE_FG AS param1, CAST(NULL AS VARCHAR) AS param2, B.TITLE AS title, "
                        +
                        "    (SELECT COUNT(1) FROM CM_BOARD_LIKE L WHERE L.BOARD_NO = B.BOARD_NO) AS like_cnt, " +
                        "    (SELECT COUNT(1) FROM CM_BOARD_DETAIL D2 WHERE D2.BOARD_NO = B.BOARD_NO AND D2.REPLY_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    B.INS_DTIME AS reg_date " +
                        "  FROM CM_BOARD_DETAIL D JOIN CM_BOARD B ON D.BOARD_NO = B.BOARD_NO WHERE D.REPLY_USER_ID = :userId AND D.REPLY_STAT_CD = 'A' AND B.WRITER_USER_ID != :userId "
                        +
                        "  UNION ALL " +
                        "  SELECT DISTINCT 'CN_NOTICE' AS post_type, N.CN_NOTICE_NO AS pk_no, CAST(N.CN_NO AS VARCHAR) AS param1, CAST(NULL AS VARCHAR) AS param2, N.TITLE AS title, "
                        +
                        "    CAST(0 AS BIGINT) AS like_cnt, " +
                        "    (SELECT COUNT(1) FROM CN_NOTICE_DETAIL D2 WHERE D2.CN_NOTICE_NO = N.CN_NOTICE_NO AND D2.COMMENT_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    N.INS_DTIME AS reg_date " +
                        "  FROM CN_NOTICE_DETAIL D JOIN CN_NOTICE N ON D.CN_NOTICE_NO = N.CN_NOTICE_NO WHERE D.COMMENT_USER_ID = :userId AND D.COMMENT_STAT_CD = 'A' AND N.WRITER_USER_ID != :userId "
                        +
                        "  UNION ALL " +
                        "  SELECT DISTINCT 'CN_BOARD' AS post_type, B2.CN_BOARD_NO AS pk_no, CAST((SELECT T.CN_NO FROM CN_BOARD_TYPE T WHERE T.CN_BOARD_TYPE_NO = B2.CN_BOARD_TYPE_NO) AS VARCHAR) AS param1, CAST(B2.CN_BOARD_TYPE_NO AS VARCHAR) AS param2, B2.TITLE AS title, "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B2.CN_BOARD_NO) AS like_cnt, "
                        +
                        "    (SELECT COUNT(1) FROM CN_BOARD_DETAIL D2 WHERE D2.CN_BOARD_NO = B2.CN_BOARD_NO AND D2.REPLY_STAT_CD = 'A') AS reply_cnt, "
                        +
                        "    B2.INS_DTIME AS reg_date " +
                        "  FROM CN_BOARD_DETAIL D JOIN CN_BOARD B2 ON D.CN_BOARD_NO = B2.CN_BOARD_NO WHERE D.REPLY_USER_ID = :userId AND D.REPLY_STAT_CD = 'A' AND B2.WRITER_USER_ID != :userId "
                        +
                        ") T ORDER BY T.reg_date DESC LIMIT :size OFFSET :offset", nativeQuery = true)
        List<Map<String, Object>> findMyCommentedPosts(@Param("userId") String userId,
                        @Param("size") int size,
                        @Param("offset") int offset);

        @Query(value = "SELECT " +
                        "    S.SCRAP_NO AS \"scrapNo\", " +
                        "    S.SCRAP_TABLE_NM AS \"scrapTableNm\", " +
                        "    S.SCRAP_TABLE_PK_NO AS \"scrapTablePkNo\", " +
                        "    S.SCRAP_DATE AS \"scrapDate\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN B1.BOARD_TYPE_FG " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN CAST(N.CN_NO AS VARCHAR) " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN CAST((SELECT T.CN_NO FROM CN_BOARD_TYPE T WHERE T.CN_BOARD_TYPE_NO = B2.CN_BOARD_TYPE_NO) AS VARCHAR) "
                        +
                        "    END AS \"param1\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN CAST(B2.CN_BOARD_TYPE_NO AS VARCHAR) " +
                        "        ELSE CAST(NULL AS VARCHAR) " +
                        "    END AS \"param2\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN B1.TITLE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN N.TITLE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN B2.TITLE " +
                        "    END AS \"title\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B1.WRITER_USER_ID) "
                        +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = N.WRITER_USER_ID) "
                        +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN (SELECT U.USER_NICK_NM FROM MM_USER U WHERE U.USER_ID = B2.WRITER_USER_ID) "
                        +
                        "    END AS \"writerName\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN (SELECT COUNT(1) FROM CM_BOARD_LIKE L WHERE L.BOARD_NO = B1.BOARD_NO) "
                        +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN CAST(0 AS BIGINT) " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN (SELECT COUNT(1) FROM CN_BOARD_LIKE L WHERE L.CN_BOARD_NO = B2.CN_BOARD_NO) "
                        +
                        "    END AS \"likeCnt\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN (SELECT COUNT(1) FROM CM_BOARD_DETAIL D WHERE D.BOARD_NO = B1.BOARD_NO AND D.REPLY_STAT_CD = 'A') "
                        +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN (SELECT COUNT(1) FROM CN_NOTICE_DETAIL D WHERE D.CN_NOTICE_NO = N.CN_NOTICE_NO AND D.COMMENT_STAT_CD = 'A') "
                        +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN (SELECT COUNT(1) FROM CN_BOARD_DETAIL D WHERE D.CN_BOARD_NO = B2.CN_BOARD_NO AND D.REPLY_STAT_CD = 'A') "
                        +
                        "    END AS \"replyCnt\", " +
                        "    CASE " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CM_BOARD' THEN B1.INS_DTIME " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_NOTICE' THEN N.INS_DTIME " +
                        "        WHEN S.SCRAP_TABLE_NM = 'CN_BOARD' THEN B2.INS_DTIME " +
                        "    END AS \"originalRegDate\" " +
                        "FROM CM_SCRAP S " +
                        "LEFT JOIN CM_BOARD B1 ON S.SCRAP_TABLE_NM = 'CM_BOARD' AND S.SCRAP_TABLE_PK_NO = B1.BOARD_NO "
                        +
                        "LEFT JOIN CN_NOTICE N ON S.SCRAP_TABLE_NM = 'CN_NOTICE' AND S.SCRAP_TABLE_PK_NO = N.CN_NOTICE_NO "
                        +
                        "LEFT JOIN CN_BOARD B2 ON S.SCRAP_TABLE_NM = 'CN_BOARD' AND S.SCRAP_TABLE_PK_NO = B2.CN_BOARD_NO "
                        +
                        "WHERE S.USER_ID = :userId " +
                        "ORDER BY S.SCRAP_NO DESC", nativeQuery = true)
        List<Map<String, Object>> findMyScraps(@Param("userId") String userId);
}
