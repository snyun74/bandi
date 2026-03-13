package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_NOTICE")
@Getter
@Setter
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_no")
    private Long noticeNo;

    @Column(name = "title", length = 400, nullable = false)
    private String title;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "writer_user_id", length = 20, nullable = false)
    private String writerUserId;

    @Column(name = "pin_yn", length = 1, nullable = false)
    private String pinYn;

    @Column(name = "std_date", length = 8, nullable = false)
    private String stdDate;

    @Column(name = "end_date", length = 8, nullable = false)
    private String endDate;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
