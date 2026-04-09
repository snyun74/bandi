package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_POSTS_ATTACHMENT")
@IdClass(PostAttachmentId.class)
@Getter
@Setter
public class PostAttachment {

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Id
    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "post_stat_cd", nullable = false, length = 20)
    private String postStatCd;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

}
