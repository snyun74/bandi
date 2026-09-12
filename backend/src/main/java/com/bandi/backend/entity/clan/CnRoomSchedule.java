package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_ROOM_SCHEDULE")
@Getter
@Setter
public class CnRoomSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CN_SCH_NO")
    private Long cnSchNo;

    @Column(name = "CN_NO", nullable = false)
    private Long cnNo;

    @Column(name = "BN_NO", nullable = false)
    private Long bnNo;

    @Column(name = "SCH_STT_DATE", length = 8, nullable = false)
    private String schSttDate;

    @Column(name = "SCH_STT_TIME", length = 6, nullable = false)
    private String schSttTime;

    @Column(name = "SCH_END_DATE", length = 8, nullable = false)
    private String schEndDate;

    @Column(name = "SCH_END_TIME", length = 6, nullable = false)
    private String schEndTime;

    @Column(name = "SCH_STAT_CD", length = 20, nullable = false)
    private String schStatCd;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
