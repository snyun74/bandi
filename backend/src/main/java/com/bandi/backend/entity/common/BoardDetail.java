package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BOARD_DETAIL")
@Getter
@Setter
public class BoardDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_no")
    private Long replyNo;

    @Column(name = "board_no")
    private Long boardNo;

    @Column(name = "reply_user_id", length = 20)
    private String replyUserId;

    @Column(name = "parent_reply_no")
    private Long parentReplyNo;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "reply_stat_cd", length = 20)
    private String replyStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
