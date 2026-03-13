package com.bandi.backend.repository;

import com.bandi.backend.entity.common.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByOrderByInsDtimeDesc();

    @Query("SELECT n FROM Notice n WHERE n.stdDate <= :today AND n.endDate >= :today ORDER BY n.insDtime DESC")
    List<Notice> findActiveNotices(String today);
}
