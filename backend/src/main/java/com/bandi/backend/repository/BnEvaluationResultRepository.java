package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEvaluationResult;
import com.bandi.backend.entity.band.BnEvaluationResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BnEvaluationResultRepository extends JpaRepository<BnEvaluationResult, BnEvaluationResultId> {

    @Query(value = """
            SELECT  ROUND(COALESCE(AVG(ER.BN_EVAL_SCORE)\\:\\:NUMERIC, 0), 1) AS SCORE
                ,   COALESCE(SUM(CASE WHEN ER.BN_MOOD_MAKER_FG = 'Y' THEN 1 ELSE 0 END), 0) AS MOOK_MAKER_CNT
            FROM    BN_GROUP G
            JOIN    BN_EVALUATION_RESULT ER ON ER.BN_NO = G.BN_NO
            WHERE   G.BN_CONF_FG = 'E'
                AND NOT EXISTS (
                    SELECT  1
                    FROM    BN_EVALUATION E
                    WHERE   E.BN_NO      = G.BN_NO
                        AND E.BN_EVAL_YN = 'N'
                )
                AND ER.BN_SESSION_JOIN_USER_ID = :userId
            """, nativeQuery = true)
    Object[][] getUserEvalStats(@Param("userId") String userId);
}
