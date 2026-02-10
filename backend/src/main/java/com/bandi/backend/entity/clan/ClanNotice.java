package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_NOTICE")
@Getter
@Setter
public class ClanNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_notice_no")
    private Long cnNoticeNo;

    @Column(name = "cn_no")
    private Long cnNo;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM CN_NOTICE_DETAIL d WHERE d.cn_notice_no = cn_notice_no)")
    private Integer commentCount;

    @Column(name = "title", length = 400)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "writer_user_id", length = 20)
    private String writerUserId;

    @Column(name = "pin_yn", length = 1)
    private String pinYn;

    @Column(name = "std_date", length = 8)
    private String stdDate;

    @Column(name = "end_date", length = 8)
    private String endDate;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
    @Column(name = "youtube_url", length = 500)
    private String youtubeUrl;
}
