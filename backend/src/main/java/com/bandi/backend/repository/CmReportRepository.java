package com.bandi.backend.repository;

import com.bandi.backend.entity.common.CmReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CmReportRepository extends JpaRepository<CmReport, Long> {
}
