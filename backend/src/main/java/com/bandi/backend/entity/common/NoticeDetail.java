package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_NOTICE_DETAIL")
@Getter
@Setter
public class NoticeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_no")
    private Long commentNo;

    @Column(name = "notice_no")
    private Long noticeNo;

    @Column(name = "comment_user_id", length = 20)
    private String commentUserId;

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
