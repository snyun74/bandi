package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_NOTICE_DETAIL")
@Getter
@Setter
public class ClanNoticeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_comment_no")
    private Long cnCommentNo;

    @Column(name = "cn_notice_no")
    private Long cnNoticeNo;

    @Column(name = "comment_user_id", length = 20)
    private String commentUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_user_id", insertable = false, updatable = false)
    private com.bandi.backend.entity.member.User user;

    @Column(name = "parent_comment_no")
    private Long parentCommentNo;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "comment_stat_cd", length = 20)
    private String commentStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
