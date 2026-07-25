package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.ShortsView;
import com.bandi.backend.entity.sns.ShortsViewId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShortsViewRepository extends JpaRepository<ShortsView, ShortsViewId> {
    long countByShortsNo(Long shortsNo);
    boolean existsByShortsNoAndUserId(Long shortsNo, String userId);
    Optional<ShortsView> findByShortsNoAndUserId(Long shortsNo, String userId);
}
