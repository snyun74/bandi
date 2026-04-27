package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.Shorts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShortsRepository extends JpaRepository<Shorts, Long> {
    Page<Shorts> findByUserIdOrderByInsDtimeDesc(String userId, Pageable pageable);
    Page<Shorts> findByUserIdAndShortsStatCdOrderByInsDtimeDesc(String userId, String shortsStatCd, Pageable pageable);
    Page<Shorts> findByPublicTypeCdAndShortsStatCdOrderByInsDtimeDesc(String publicTypeCd, String shortsStatCd, Pageable pageable);
}
