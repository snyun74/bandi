package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_VOTE_RESULT")
@Getter
@Setter
@IdClass(ClanVoteResultId.class)
public class ClanVoteResult {

    @Id
    @Column(name = "cn_vote_no")
    private Long cnVoteNo;

    @Id
    @Column(name = "cn_vote_question_no")
    private Long cnVoteQuestionNo;

    @Id
    @Column(name = "cn_vote_item_no")
    private Long cnVoteItemNo;

    @Id
    @Column(name = "cn_vote_result_user_id", length = 20)
    private String cnVoteResultUserId;
}
