package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_REPORT")
@Getter
@Setter
public class CmReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_no")
    private Long reportNo;

    @Column(name = "report_user_id", nullable = false, length = 20)
    private String reportUserId;

    @Column(name = "target_user_id", nullable = false, length = 20)
    private String targetUserId;

    @Column(name = "board_url", nullable = false, length = 400)
    private String boardUrl;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "report_dtime", nullable = false, length = 14)
    private String reportDtime;

    @Column(name = "report_proc_dtime", length = 14)
    private String reportProcDtime;

    @Column(name = "proc_stat_fg", nullable = false, length = 1)
    private String procStatFg; // N:신고, Y:처리, R:거부

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
