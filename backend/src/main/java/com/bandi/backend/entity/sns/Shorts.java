package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_SHORTS")
@Getter
@Setter
public class Shorts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shorts_no")
    private Long shortsNo;

    @Column(name = "user_id", nullable = false, length = 20)
    private String userId;

    @Column(name = "music_id")
    private Long musicId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "video_attach_no", nullable = false)
    private Long videoAttachNo;

    @Column(name = "thumbnail_attach_no")
    private Long thumbnailAttachNo;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "public_type_cd", nullable = false, length = 20)
    private String publicTypeCd;

    @Column(name = "shorts_stat_cd", nullable = false, length = 20)
    private String shortsStatCd;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;
}
