package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_VOTE_ITEM")
@Getter
@Setter
public class ClanVoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_vote_item_no")
    private Long cnVoteItemNo;

    @Column(name = "cn_vote_question_no", nullable = false)
    private Long cnVoteQuestionNo;

    @Column(name = "cn_vote_item_order", nullable = false)
    private Integer cnVoteItemOrder;

    @Column(name = "cn_vote_item_text", nullable = false, length = 200)
    private String cnVoteItemText;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
