package com.bandi.backend.repository;

import com.bandi.backend.entity.common.CmReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface CmReportRepository extends JpaRepository<CmReport, Long> {
    long countByProcStatFg(String procStatFg);

    @Query(value = 
        "SELECT r.report_no as reportNo, r.report_user_id as reportUserId, u1.user_nick_nm as reportUserNickNm, " +
        "r.target_user_id as targetUserId, u2.user_nick_nm as targetUserNickNm, " +
        "r.board_url as boardUrl, r.content as content, r.report_dtime as reportDtime, r.proc_stat_fg as procStatFg " +
        "FROM CM_REPORT r " +
        "LEFT JOIN MM_USER u1 ON r.report_user_id = u1.user_id " +
        "LEFT JOIN MM_USER u2 ON r.target_user_id = u2.user_id " +
        "WHERE (:search IS NULL OR :search = '' " +
        "OR r.report_user_id LIKE %:search% OR u1.user_nick_nm LIKE %:search% " +
        "OR r.target_user_id LIKE %:search% OR u2.user_nick_nm LIKE %:search%) " +
        "ORDER BY r.report_dtime DESC", 
        countQuery = "SELECT count(*) FROM CM_REPORT r " +
        "LEFT JOIN MM_USER u1 ON r.report_user_id = u1.user_id " +
        "LEFT JOIN MM_USER u2 ON r.target_user_id = u2.user_id " +
        "WHERE (:search IS NULL OR :search = '' " +
        "OR r.report_user_id LIKE %:search% OR u1.user_nick_nm LIKE %:search% " +
        "OR r.target_user_id LIKE %:search% OR u2.user_nick_nm LIKE %:search%)",
        nativeQuery = true)
    Page<CmReportProjection> findAllReportsWithNicknames(@Param("search") String search, Pageable pageable);
}
