package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_VOTE_ITEM")
@Getter
@Setter
public class BnVoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_vote_item_no")
    private Long bnVoteItemNo;

    @Column(name = "bn_vote_question_no", nullable = false)
    private Long bnVoteQuestionNo;

    @Column(name = "bn_vote_item_order", nullable = false)
    private Integer bnVoteItemOrder;

    @Column(name = "bn_vote_item_text", columnDefinition = "TEXT", nullable = false)
    private String bnVoteItemText;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
