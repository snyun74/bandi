package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClanBoardLikeRepository extends JpaRepository<ClanBoardLike, Long> {
    boolean existsByCnBoardNoAndUserId(Long cnBoardNo, String userId);

    void deleteByCnBoardNoAndUserId(Long cnBoardNo, String userId);
}
