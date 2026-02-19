package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BandSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BandScheduleRepository extends JpaRepository<BandSchedule, Long> {
    List<BandSchedule> findByBnNo(Long bnNo);

    List<BandSchedule> findByBnNoAndBnSchSttDate(Long bnNo, String bnSchSttDate);
}
