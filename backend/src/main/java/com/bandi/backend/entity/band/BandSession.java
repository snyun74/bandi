package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_SESSION")
@Getter
@Setter
public class BandSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_session_no")
    private Long bnSessionNo;

    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "bn_session_nm", length = 100)
    private String bnSessionNm;

    @Column(name = "bn_session_desc", length = 400)
    private String bnSessionDesc;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
