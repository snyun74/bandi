package com.bandi.backend.entity.band;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@Entity
@Table(name = "BN_EVALUATION_RESULT")
@IdClass(BnEvaluationResultId.class)
public class BnEvaluationResult {

    @Id
    @Column(name = "BN_NO")
    private Long bnNo;

    @Id
    @Column(name = "BN_EVAL_USER_ID")
    private String bnEvalUserId;

    @Id
    @Column(name = "BN_SESSION_JOIN_USER_ID")
    private String bnSessionJoinUserId;

    @Column(name = "BN_EVAL_SCORE")
    private Integer bnEvalScore;

    @Column(name = "BN_MOOD_MAKER_FG")
    private String bnMoodMakerFg; // 'Y' or 'N'

    @Column(name = "INS_DTIME")
    private String insDtime;

    @Column(name = "INS_ID")
    private String insId;

    @Column(name = "UPD_DTIME")
    private String updDtime;

    @Column(name = "UPD_ID")
    private String updId;
}
