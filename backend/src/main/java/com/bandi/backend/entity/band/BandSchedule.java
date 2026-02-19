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

    @Column(name = "bn_sch_title", length = 400)
    private String bnSchTitle;

    @Column(name = "bn_sch_content", columnDefinition = "TEXT")
    private String bnSchContent;

    @Column(name = "bn_sch_stt_date", length = 8)
    private String bnSchSttDate;

    @Column(name = "bn_sch_stt_time", length = 6)
    private String bnSchSttTime;

    @Column(name = "bn_sch_end_date", length = 8)
    private String bnSchEndDate;

    @Column(name = "bn_sch_end_time", length = 6)
    private String bnSchEndTime;

    @Column(name = "bn_sch_all_day_yn", length = 1)
    private String bnSchAllDayYn;

    @Column(name = "bn_sch_stat_cd", length = 20)
    private String bnSchStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
