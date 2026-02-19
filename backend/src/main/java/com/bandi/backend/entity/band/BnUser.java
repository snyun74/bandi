package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_USER")
@Getter
@Setter
@IdClass(BnUserId.class)
public class BnUser {

    @Id
    @Column(name = "BN_NO")
    private Long bnNo;

    @Id
    @Column(name = "BN_USER_ID", length = 20)
    private String bnUserId;

    @Column(name = "BN_ROLE_CD", length = 20, nullable = false)
    private String bnRoleCd;

    @Column(name = "BN_JOIN_DATE", length = 8)
    private String bnJoinDate;

    @Column(name = "BN_USER_STAT_CD", length = 20, nullable = false)
    private String bnUserStatCd;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
