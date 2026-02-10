package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardDetailLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanBoardDetailLikeRepository extends JpaRepository<ClanBoardDetailLike, Long> {

    @Query("SELECT l.cnReplyNo, COUNT(l) " +
            "FROM ClanBoardDetailLike l " +
            "WHERE l.cnReplyNo IN :replyIds " +
            "GROUP BY l.cnReplyNo")
    List<Object[]> countLikesByReplyIds(@Param("replyIds") List<Long> replyIds);

    boolean existsByCnReplyNoAndUserId(Long cnReplyNo, String userId);

    void deleteByCnReplyNoAndUserId(Long cnReplyNo, String userId);
}
