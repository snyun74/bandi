package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_RESERVATION")
@Getter
@Setter
public class BnReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resv_no")
    private Long resvNo;

    @Column(name = "room_no", nullable = false)
    private Long roomNo;

    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "user_id", length = 20, nullable = false)
    private String userId;

    @Column(name = "use_date", length = 8, nullable = false)
    private String useDate;

    @Column(name = "stt_time", length = 4, nullable = false)
    private String sttTime;

    @Column(name = "end_time", length = 4, nullable = false)
    private String endTime;

    @Column(name = "resv_tot_amt", nullable = false)
    private Integer resvTotAmt;

    @Column(name = "payment_amt", nullable = false)
    private Integer paymentAmt;

    @Column(name = "payment_pg_key", length = 400)
    private String paymentPgKey;

    @Column(name = "payment_stat_fg", length = 20, nullable = false)
    private String paymentStatFg;

    @Column(name = "resv_stat_fg", length = 20, nullable = false)
    private String resvStatFg;

    @Column(name = "resv_reject_bigo", columnDefinition = "TEXT")
    private String resvRejectBigo;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
