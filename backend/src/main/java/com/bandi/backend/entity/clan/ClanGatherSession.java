package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BN_SESSION")
@Getter
@Setter
public class ClanGatherSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SESSION_NO")
    private Long sessionNo;

    @Column(name = "GATHER_NO", nullable = false)
    private Long gatherNo;

    @Column(name = "SESSION_TYPE_CD", length = 20, nullable = false)
    private String sessionTypeCd;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
