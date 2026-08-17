package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEduCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnEduCourseRepository extends JpaRepository<BnEduCourse, Long> {
    List<BnEduCourse> findByUserIdOrderByInsDtimeDesc(String userId);
    List<BnEduCourse> findByCourseStatCdOrderByInsDtimeDesc(String courseStatCd);
    List<BnEduCourse> findByUserIdAndCourseStatCdOrderByInsDtimeDesc(String userId, String courseStatCd);
}
