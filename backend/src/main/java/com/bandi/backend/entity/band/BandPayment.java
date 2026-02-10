package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_PAYMENT")
@Getter
@Setter
public class BandPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_pay_no")
    private Long bnPayNo;

    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "bn_pay_nm", length = 200)
    private String bnPayNm;

    @Column(name = "bn_pay_amt")
    private Long bnPayAmt;

    @Column(name = "bn_pay_desc", length = 400)
    private String bnPayDesc;

    @Column(name = "bn_pay_stat_cd", length = 20)
    private String bnPayStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
