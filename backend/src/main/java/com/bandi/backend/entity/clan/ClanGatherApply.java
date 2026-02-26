package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BN_GATHER_APPLY")
@Getter
@Setter
public class ClanGatherApply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "APPLY_NO")
    private Long applyNo;

    @Column(name = "GATHER_NO", nullable = false)
    private Long gatherNo;

    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "SESSION_TYPE_CD_1ST", length = 20, nullable = false)
    private String sessionTypeCd1st;

    @Column(name = "SESSION_1ST_SCORE", nullable = false)
    private Integer session1stScore;

    @Column(name = "SESSION_TYPE_CD_2ND", length = 20)
    private String sessionTypeCd2nd;

    @Column(name = "SESSION_2ND_SCORE", nullable = false)
    private Integer session2ndScore;

    @Column(name = "USER_MBTI", length = 4)
    private String userMbti;

    @Column(name = "USER_GENDER_CD", length = 20)
    private String userGenderCd;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
