package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_RSV_SESSION")
@Getter
@Setter
public class BnRsvSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BN_RSV_SESSION_NO")
    private Long bnRsvSessionNo;

    @Column(name = "BN_NO")
    private Long bnNo;

    @Column(name = "BN_SESSION_TYPE_CD", length = 20)
    private String bnSessionTypeCd;

    @Column(name = "BN_SESSION_RSV_USER_ID", length = 20)
    private String bnSessionRsvUserId;

    @Column(name = "INS_DTIME", length = 14)
    private String insDtime;

    @Column(name = "INS_ID", length = 20)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20)
    private String updId;
}
