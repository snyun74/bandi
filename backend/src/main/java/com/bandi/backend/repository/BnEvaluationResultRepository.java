package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEvaluationResult;
import com.bandi.backend.entity.band.BnEvaluationResultId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BnEvaluationResultRepository extends JpaRepository<BnEvaluationResult, BnEvaluationResultId> {
}
