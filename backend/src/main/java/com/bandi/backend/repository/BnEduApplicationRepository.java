package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEduApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnEduApplicationRepository extends JpaRepository<BnEduApplication, Long> {
    List<BnEduApplication> findByCourseNoOrderByInsDtimeDesc(Long courseNo);
    List<BnEduApplication> findByCourseNoInOrderByInsDtimeDesc(List<Long> courseNos);
    List<BnEduApplication> findByUserIdOrderByInsDtimeDesc(String userId);
    List<BnEduApplication> findByCourseNoAndUserId(Long courseNo, String userId);
}
