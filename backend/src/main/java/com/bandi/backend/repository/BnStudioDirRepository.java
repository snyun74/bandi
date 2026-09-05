package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnStudioDir;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BnStudioDirRepository extends JpaRepository<BnStudioDir, Long> {

    Optional<BnStudioDir> findByStudioNmAndRoadAddress(String studioNm, String roadAddress);

    boolean existsByStudioNmAndRoadAddress(String studioNm, String roadAddress);

    boolean existsByStudioNmAndJibunAddress(String studioNm, String jibunAddress);

    // 1. 전체 사용 가능한 합주실 목록 (정렬별)
    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' ORDER BY COALESCE(d.updDtime, d.insDtime) DESC, d.dirNo DESC")
    Page<BnStudioDir> findByUseYnOrderByLatest(Pageable pageable);

    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' ORDER BY d.studioNm ASC, d.dirNo ASC")
    Page<BnStudioDir> findByUseYnOrderByNameAsc(Pageable pageable);

    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' ORDER BY d.studioNm DESC, d.dirNo DESC")
    Page<BnStudioDir> findByUseYnOrderByNameDesc(Pageable pageable);

    // 2. 키워드 검색 (정렬별)
    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' AND (" +
            "LOWER(d.studioNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.roadAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.jibunAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sido) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sigungu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.dong) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") ORDER BY COALESCE(d.updDtime, d.insDtime) DESC, d.dirNo DESC")
    Page<BnStudioDir> searchByKeywordLatest(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' AND (" +
            "LOWER(d.studioNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.roadAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.jibunAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sido) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sigungu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.dong) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") ORDER BY d.studioNm ASC, d.dirNo ASC")
    Page<BnStudioDir> searchByKeywordNameAsc(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d FROM BnStudioDir d WHERE d.useYn = 'Y' AND (" +
            "LOWER(d.studioNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.roadAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.jibunAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sido) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sigungu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.dong) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") ORDER BY d.studioNm DESC, d.dirNo DESC")
    Page<BnStudioDir> searchByKeywordNameDesc(@Param("keyword") String keyword, Pageable pageable);

    // 관리자용
    @Query("SELECT d FROM BnStudioDir d WHERE (:keyword IS NULL OR :keyword = '' OR " +
            "LOWER(d.studioNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.roadAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.jibunAddress) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sido) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.sigungu) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.dong) LIKE LOWER(CONCAT('%', :keyword, '%'))" +
            ") ORDER BY COALESCE(d.updDtime, d.insDtime) DESC, d.dirNo DESC")
    Page<BnStudioDir> findAllForAdmin(@Param("keyword") String keyword, Pageable pageable);
}
