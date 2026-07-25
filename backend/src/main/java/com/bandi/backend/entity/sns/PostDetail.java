package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_POSTS_DETAIL")
@Getter
@Setter
public class PostDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "posts_reply_no")
    private Long postsReplyNo;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "reply_user_id", nullable = false, length = 20)
    private String replyUserId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "reply_stat_cd", nullable = false, length = 20)
    private String replyStatCd;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
