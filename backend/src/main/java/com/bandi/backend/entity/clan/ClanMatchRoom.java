package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "CN_BN_MATCH_ROOM")
@Getter
@Setter
public class ClanMatchRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROOM_NO")
    private Long roomNo;

    @Column(name = "GATHER_NO", nullable = false)
    private Long gatherNo;

    @Column(name = "ROOM_NM", length = 200, nullable = false)
    private String roomNm;

    @Column(name = "SKILL_SCORE_TOT", nullable = false)
    private Integer skillScoreTot;

    @Column(name = "MEMBER_CNT", nullable = false)
    private Integer memberCnt;

    @Column(name = "SKILL_SCORE_AVG", precision = 5, scale = 2, nullable = false)
    private BigDecimal skillScoreAvg;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
