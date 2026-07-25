package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_PARTNER")
@Getter
@Setter
public class BnPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partner_no")
    private Long partnerNo;

    @Column(name = "user_id", length = 20, nullable = false)
    private String userId;

    @Column(name = "biz_reg_no", length = 20, nullable = false)
    private String bizRegNo;

    @Column(name = "biz_nm", length = 200, nullable = false)
    private String bizNm;

    @Column(name = "biz_master_nm", length = 50, nullable = false)
    private String bizMasterNm;

    @Column(name = "biz_tel_no", length = 20)
    private String bizTelNo;

    @Column(name = "biz_hp_no", length = 20)
    private String bizHpNo;

    @Column(name = "partner_stat_cd", length = 20, nullable = false)
    private String partnerStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
