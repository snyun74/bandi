package com.bandi.backend.repository;

import com.bandi.backend.entity.member.MmQa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MmQaRepository extends JpaRepository<MmQa, Long> {
    List<MmQa> findByUserIdOrderByQaNoDesc(String userId);

    List<MmQa> findByParentQaNo(Long parentQaNo);
}
