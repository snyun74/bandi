package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_POSTS_VIEW")
@IdClass(PostViewId.class)
@Getter
@Setter
public class PostView {

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
