package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmAdBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmAdBannerRepository extends JpaRepository<CmAdBanner, String> {
    List<CmAdBanner> findAllByOrderByInsDtimeDesc(); // 등록 순 최신 조회 (옵션)
}
