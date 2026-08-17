package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEduLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BnEduLessonRepository extends JpaRepository<BnEduLesson, Long> {
    List<BnEduLesson> findByCourseNoOrderByLessonSeqAsc(Long courseNo);
    List<BnEduLesson> findByCourseNoAndLessonStatCdOrderByLessonSeqAsc(Long courseNo, String lessonStatCd);
    long countByCourseNo(Long courseNo);
    long countByCourseNoAndLessonStatCd(Long courseNo, String lessonStatCd);
}
