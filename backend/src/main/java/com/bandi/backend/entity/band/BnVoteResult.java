package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_VOTE_RESULT")
@Getter
@Setter
@IdClass(BnVoteResultId.class)
public class BnVoteResult {

    @Id
    @Column(name = "bn_vote_no")
    private Long bnVoteNo;

    @Id
    @Column(name = "bn_vote_question_no")
    private Long bnVoteQuestionNo;

    @Id
    @Column(name = "bn_vote_item_no")
    private Long bnVoteItemNo;

    @Id
    @Column(name = "bn_vote_result_user_id", length = 20)
    private String bnVoteResultUserId;
}
