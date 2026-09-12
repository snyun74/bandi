package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.CnRoomSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CnRoomScheduleRepository extends JpaRepository<CnRoomSchedule, Long> {

    @Query("SELECT rs FROM CnRoomSchedule rs " +
           "WHERE rs.cnNo = :cnNo " +
           "  AND rs.schStatCd = 'A' " +
           "  AND rs.schSttDate <= :endDate " +
           "  AND rs.schEndDate >= :startDate " +
           "ORDER BY rs.schSttDate ASC, rs.schSttTime ASC")
    List<CnRoomSchedule> findAllByCnNoAndDateRange(@Param("cnNo") Long cnNo,
                                                  @Param("startDate") String startDate,
                                                  @Param("endDate") String endDate);

    @Query("SELECT rs FROM CnRoomSchedule rs " +
           "WHERE rs.cnNo = :cnNo " +
           "  AND rs.schStatCd = 'A' " +
           "  AND (CONCAT(rs.schSttDate, rs.schSttTime) < :newEndDateTime) " +
           "  AND (CONCAT(rs.schEndDate, rs.schEndTime) > :newStartDateTime)")
    List<CnRoomSchedule> findOverlappingSchedules(@Param("cnNo") Long cnNo,
                                                 @Param("newStartDateTime") String newStartDateTime,
                                                 @Param("newEndDateTime") String newEndDateTime);
}
