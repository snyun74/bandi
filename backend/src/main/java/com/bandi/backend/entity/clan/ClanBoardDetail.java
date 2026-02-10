package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BOARD_DETAIL")
@Getter
@Setter
public class ClanBoardDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_reply_no")
    private Long cnReplyNo;

    @Column(name = "cn_board_no")
    private Long cnBoardNo;

    @Column(name = "reply_user_id", length = 20)
    private String replyUserId;

    @Column(name = "parent_reply_no")
    private Long parentReplyNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_user_id", insertable = false, updatable = false)
    private com.bandi.backend.entity.member.User user;

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
