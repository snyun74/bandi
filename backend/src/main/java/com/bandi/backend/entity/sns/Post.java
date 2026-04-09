package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_POSTS")
@Getter
@Setter
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @Column(name = "user_id", nullable = false, length = 20)
    private String userId;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "public_type_cd", nullable = false, length = 20)
    private String publicTypeCd;

    @Column(name = "post_stat_cd", nullable = false, length = 20)
    private String postStatCd;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

}
