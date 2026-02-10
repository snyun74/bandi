package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanBoardDetailRepository extends JpaRepository<ClanBoardDetail, Long> {

        @Query(value = "SELECT D " +
                        "FROM ClanBoardDetail D " +
                        "WHERE D.cnBoardNo = :cnBoardNo " +
                        "  AND D.replyStatCd = 'A' " +
                        "ORDER BY COALESCE(D.parentReplyNo, D.cnReplyNo) DESC, D.cnReplyNo ASC")
        List<ClanBoardDetail> findCommentsByBoardNo(@Param("cnBoardNo") Long cnBoardNo);

        @Query("SELECT d.parentReplyNo, COUNT(d) " +
                        "FROM ClanBoardDetail d " +
                        "WHERE d.cnBoardNo = :cnBoardNo " +
                        "  AND d.parentReplyNo IS NOT NULL " +
                        "  AND d.replyStatCd = 'A' " +
                        "GROUP BY d.parentReplyNo")
        List<Object[]> countChildRepliesByBoardNo(@Param("cnBoardNo") Long cnBoardNo);
}
