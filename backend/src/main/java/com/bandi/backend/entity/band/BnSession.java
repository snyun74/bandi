package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_SESSION")
@Getter
@Setter
public class BnSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BN_SESSION_NO")
    private Long bnSessionNo;

    @Column(name = "BN_NO")
    private Long bnNo;

    @Column(name = "BN_SESSION_TYPE_CD", length = 20)
    private String bnSessionTypeCd;

    @Column(name = "BN_SESSION_JOIN_USER_ID", length = 20)
    private String bnSessionJoinUserId;

    @Column(name = "INS_DTIME", length = 14)
    private String insDtime;

    @Column(name = "INS_ID", length = 20)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20)
    private String updId;
}
