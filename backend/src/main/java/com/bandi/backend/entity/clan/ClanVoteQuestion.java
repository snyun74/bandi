package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_VOTE_QUESTION")
@Getter
@Setter
public class ClanVoteQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_vote_question_no")
    private Long cnVoteQuestionNo;

    @Column(name = "cn_vote_no", nullable = false)
    private Long cnVoteNo;

    @Column(name = "cn_vote_question_order", nullable = false)
    private Integer cnVoteQuestionOrder;

    @Column(name = "cn_vote_question_type", nullable = false, length = 10)
    private String cnVoteQuestionType; // 'MULT' or 'SING'

    @Column(name = "cn_vote_question_text", nullable = false, length = 200)
    private String cnVoteQuestionText;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
