package com.bandi.backend.repository;

import com.bandi.backend.entity.member.MmQa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MmQaRepository extends JpaRepository<MmQa, Long> {
    List<MmQa> findByUserIdOrderByQaNoDesc(String userId);

    List<MmQa> findByParentQaNo(Long parentQaNo);

    @Query("SELECT COUNT(q) FROM MmQa q WHERE q.parentQaNo IS NULL AND " +
            "(SELECT COUNT(a) FROM MmQa a WHERE a.parentQaNo = q.qaNo) = 0")
    long countUnansweredQas();
}
