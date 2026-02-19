package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_VOTE_QUESTION")
@Getter
@Setter
public class BnVoteQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_vote_question_no")
    private Long bnVoteQuestionNo;

    @Column(name = "bn_vote_no", nullable = false)
    private Long bnVoteNo;

    @Column(name = "bn_vote_question_order", nullable = false)
    private Integer bnVoteQuestionOrder;

    @Column(name = "bn_vote_question_type", nullable = false, length = 20)
    private String bnVoteQuestionType; // e.g., using code BD201

    @Column(name = "bn_vote_question_text", columnDefinition = "TEXT", nullable = false)
    private String bnVoteQuestionText;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
