package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnPlanScheduleTime;
import com.bandi.backend.entity.band.BnPlanScheduleTimeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BnPlanScheduleTimeRepository extends JpaRepository<BnPlanScheduleTime, BnPlanScheduleTimeId> {
    List<BnPlanScheduleTime> findByBnNo(Long bnNo);
    // Find all schedules for a specific jam and date range if needed, or just all
    // for the jam
}
