package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BN_MATCH_RESULT")
@Getter
@Setter
public class ClanMatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RESULT_NO")
    private Long resultNo;

    @Column(name = "GATHER_NO", nullable = false)
    private Long gatherNo;

    @Column(name = "ROOM_NO", nullable = false)
    private Long roomNo;

    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "SESSION_TYPE_CD", length = 20, nullable = false)
    private String sessionTypeCd;

    @Column(name = "MATCH_DATE", length = 8, nullable = false)
    private String matchDate;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
