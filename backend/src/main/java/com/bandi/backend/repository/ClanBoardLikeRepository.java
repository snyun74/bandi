package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanBoardLike;
import com.bandi.backend.entity.clan.ClanBoardLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClanBoardLikeRepository extends JpaRepository<ClanBoardLike, ClanBoardLikeId> {
    boolean existsByCnBoardNoAndUserId(Long cnBoardNo, String userId);

    void deleteByCnBoardNoAndUserId(Long cnBoardNo, String userId);
}
