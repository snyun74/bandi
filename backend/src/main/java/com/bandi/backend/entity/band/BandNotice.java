package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_NOTICE")
@Getter
@Setter
public class BandNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_notice_no")
    private Long bnNoticeNo;

    @Column(name = "bn_no")
    private Long bnNo;

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
}
