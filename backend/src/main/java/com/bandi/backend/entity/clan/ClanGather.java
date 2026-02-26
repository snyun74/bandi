package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BN_GATHER")
@Getter
@Setter
public class ClanGather {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GATHER_NO")
    private Long gatherNo;

    @Column(name = "CN_NO", nullable = false)
    private Long cnNo;

    @Column(name = "TITLE", length = 400, nullable = false)
    private String title;

    @Column(name = "GATHER_DATE", length = 8)
    private String gatherDate;

    @Column(name = "ROOM_CNT", nullable = false)
    private Integer roomCnt = 0;

    @Column(name = "REG_DATE", length = 8, nullable = false)
    private String regDate;

    @Column(name = "GATHER_STAT_CD", length = 20, nullable = false)
    private String gatherStatCd;

    @Column(name = "GATHER_PROC_FG", length = 1, nullable = false)
    private String gatherProcFg;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
