package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_GROUP")
@Getter
@Setter
public class BandGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "bn_nm", length = 100)
    private String bnNm;

    @Column(name = "bn_desc", columnDefinition = "TEXT")
    private String bnDesc;

    @Column(name = "bn_owd_user_id", length = 20)
    private String bnOwdUserId;

    @Column(name = "loc_addr1", length = 200)
    private String locAddr1;

    @Column(name = "loc_addr2", length = 200)
    private String locAddr2;

    @Column(name = "bn_stat_cd", length = 20)
    private String bnStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
