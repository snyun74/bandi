package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanScheduleRepository extends JpaRepository<ClanSchedule, Long> {

    @Query("SELECT cs FROM ClanSchedule cs WHERE cs.cnNo = :cnNo AND cs.sttDate LIKE :yearMonth% ORDER BY cs.sttDate ASC, cs.sttTiem ASC")
    List<ClanSchedule> findAllByCnNoAndMonth(@Param("cnNo") Long cnNo, @Param("yearMonth") String yearMonth);
}
