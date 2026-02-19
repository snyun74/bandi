package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnPlanSchedule;
import com.bandi.backend.entity.band.BnPlanScheduleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BnPlanScheduleRepository extends JpaRepository<BnPlanSchedule, BnPlanScheduleId> {
}
