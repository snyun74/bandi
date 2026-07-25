package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.ShortsLike;
import com.bandi.backend.entity.sns.ShortsLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShortsLikeRepository extends JpaRepository<ShortsLike, ShortsLikeId> {
    long countByShortsNoAndActionTypeFg(Long shortsNo, String actionTypeFg);
    Optional<ShortsLike> findByShortsNoAndUserId(Long shortsNo, String userId);
}
