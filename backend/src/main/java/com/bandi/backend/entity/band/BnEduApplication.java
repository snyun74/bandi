package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BN_EDU_APPLICATION")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BnEduApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "APP_NO")
    private Long appNo;

    @Column(name = "COURSE_NO", nullable = false)
    private Long courseNo;

    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "PAYMENT_AMT", nullable = false)
    private Integer paymentAmt;

    @Column(name = "PAYMENT_PG_KEY", length = 400)
    private String paymentPgKey;

    @Column(name = "PAYMENT_STAT_FG", length = 20, nullable = false)
    private String paymentStatFg; // F: 무상, R: 결제대기, P: 결제완료, C: 결제취소

    @Column(name = "APP_STAT_CD", length = 20, nullable = false)
    private String appStatCd; // R: 승인대기, A: 승인완료, J: 승인거절

    @Column(name = "APP_REJECT_BIGO", columnDefinition = "TEXT")
    private String appRejectBigo;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
