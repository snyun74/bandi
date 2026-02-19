package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEvaluation;
import com.bandi.backend.entity.band.BnEvaluationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Note: I am assuming the entity package is correct.
// However, I see I used `BnEvaluation` without `_old` in the create file step.
// Let me correct the invalid import in my head and write the correct file content.

import com.bandi.backend.entity.band.BnEvaluation;
import com.bandi.backend.entity.band.BnEvaluationId;

public interface BnEvaluationRepository extends JpaRepository<BnEvaluation, BnEvaluationId> {

    @Modifying
    @Query(value = "INSERT INTO BN_EVALUATION (BN_NO, BN_EVAL_USER_ID, BN_EVAL_YN, INS_DTIME, INS_ID, UPD_DTIME, UPD_ID) "
            +
            "SELECT :bnNo, BN_SESSION_JOIN_USER_ID, 'N', :currentDateTime, :userId, :currentDateTime, :userId " +
            "FROM BN_SESSION " +
            "WHERE BN_NO = :bnNo AND BN_SESSION_JOIN_USER_ID IS NOT NULL", nativeQuery = true)
    void insertEvaluationsFromSession(@Param("bnNo") Long bnNo,
            @Param("currentDateTime") String currentDateTime,
            @Param("userId") String userId);
}
