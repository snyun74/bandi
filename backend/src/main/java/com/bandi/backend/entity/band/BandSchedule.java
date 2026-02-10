package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_SCHEDULE")
@Getter
@Setter
public class BandSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_sch_no")
    private Long bnSchNo;

    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "title", length = 400)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "stt_date", length = 8)
    private String sttDate;

    @Column(name = "stt_tiem", length = 6)
    private String sttTiem;

    @Column(name = "end_date", length = 8)
    private String endDate;

    @Column(name = "end_time", length = 6)
    private String endTime;

    @Column(name = "all_day_yn", length = 1)
    private String allDayYn;

    @Column(name = "sch_stat_cd", length = 20)
    private String schStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
