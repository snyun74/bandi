package com.bandi.backend.repository;

import com.bandi.backend.entity.band.BnEvaluationResult;
import com.bandi.backend.entity.band.BnEvaluationResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BnEvaluationResultRepository extends JpaRepository<BnEvaluationResult, BnEvaluationResultId> {

    @Query(value = """
            SELECT  ROUND(COALESCE(SUM(ER.BN_EVAL_SCORE)\\:\\:NUMERIC / NULLIF(BN.RCNT, 0), 0), 1)  AS SCORE
                ,   COALESCE(SUM(CASE WHEN ER.BN_MOOD_MAKER_FG = 'Y' THEN 1 ELSE 0 END), 0)     AS MOOK_MAKER_CNT
            FROM    (
                    SELECT  G.BN_NO
                        ,   ( SELECT COUNT(1) FROM BN_EVALUATION_RESULT E WHERE E.BN_NO = G.BN_NO AND E.BN_SESSION_JOIN_USER_ID = :userId ) AS RCNT
                    FROM    BN_GROUP G
                    WHERE   G.BN_CONF_FG = 'E'
                        AND NOT EXISTS (
                            SELECT  1
                            FROM    BN_EVALUATION E
                            WHERE   E.BN_NO      = G.BN_NO
                                AND E.BN_EVAL_YN = 'N'
                            )
                    ) BN
                    JOIN BN_EVALUATION_RESULT ER ON ER.BN_NO = BN.BN_NO
            WHERE   ER.BN_SESSION_JOIN_USER_ID = :userId
            GROUP BY BN.RCNT
            """, nativeQuery = true)
    Object[][] getUserEvalStats(@Param("userId") String userId);
}
