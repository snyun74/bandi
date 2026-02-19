package com.bandi.backend.entity.band;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@Entity
@Table(name = "BN_EVALUATION")
@IdClass(BnEvaluationId.class)
public class BnEvaluation {

    @Id
    @Column(name = "BN_NO")
    private Long bnNo;

    @Id
    @Column(name = "BN_EVAL_USER_ID")
    private String bnEvalUserId;

    @Column(name = "BN_EVAL_YN")
    private String bnEvalYn;

    @Column(name = "INS_DTIME")
    private String insDtime;

    @Column(name = "INS_ID")
    private String insId;

    @Column(name = "UPD_DTIME")
    private String updDtime;

    @Column(name = "UPD_ID")
    private String updId;
}
