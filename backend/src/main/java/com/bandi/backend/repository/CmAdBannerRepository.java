package com.bandi.backend.repository;

import com.bandi.backend.entity.cm.CmAdBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmAdBannerRepository extends JpaRepository<CmAdBanner, Long> {

    // 관리자 목록: 위치코드 → 정렬순서 → 최신 등록 순
    List<CmAdBanner> findAllByOrderByAdBannerCdAscSortSeqAscAdBannerNoDesc();

    // 노출 대상 배너: 사용 중 + 지정 상태 + 오늘이 노출기간 내 (IDX_CM_AD_BANNER_DISP 인덱스 활용)
    @Query("SELECT b FROM CmAdBanner b " +
            "WHERE b.adBannerCd = :adBannerCd " +
            "AND b.useYn = 'Y' " +
            "AND b.bannerStatCd = :bannerStatCd " +
            "AND b.sttDate <= :today " +
            "AND b.endDate >= :today " +
            "ORDER BY b.sortSeq ASC, b.adBannerNo DESC")
    List<CmAdBanner> findDisplayBanners(@Param("adBannerCd") String adBannerCd,
                                        @Param("bannerStatCd") String bannerStatCd,
                                        @Param("today") String today);
}
