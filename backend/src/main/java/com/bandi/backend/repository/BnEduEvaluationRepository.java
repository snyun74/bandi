package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEduEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BnEduEvaluationRepository extends JpaRepository<BnEduEvaluation, Long> {
    List<BnEduEvaluation> findByCourseNoOrderByInsDtimeDesc(Long courseNo);
    List<BnEduEvaluation> findByCourseNoInOrderByInsDtimeDesc(List<Long> courseNos);
    Optional<BnEduEvaluation> findByCourseNoAndUserId(Long courseNo, String userId);
    long countByCourseNo(Long courseNo);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(e.ratingScore) FROM BnEduEvaluation e WHERE e.courseNo = :courseNo")
    Double findAvgRatingByCourseNo(@org.springframework.data.repository.query.Param("courseNo") Long courseNo);
}
