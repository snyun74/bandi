package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_PAYMENT_HISTORY")
@Getter
@Setter
public class BandPaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_pay_hist_no")
    private Long bnPayHistNo;

    @Column(name = "bn_pay_user_no")
    private Long bnPayUserNo;

    @Column(name = "bn_pay_amt")
    private Long bnPayAmt;

    @Column(name = "bn_pay_date", length = 8)
    private String bnPayDate;

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
