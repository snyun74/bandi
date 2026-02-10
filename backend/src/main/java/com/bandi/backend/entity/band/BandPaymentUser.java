package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_PAYMENT_USER")
@Getter
@Setter
public class BandPaymentUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_pay_user_no")
    private Long bnPayUserNo;

    @Column(name = "bn_pay_no")
    private Long bnPayNo;

    @Column(name = "bn_user_id", length = 20)
    private String bnUserId;

    @Column(name = "bn_pay_amt")
    private Long bnPayAmt;

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
