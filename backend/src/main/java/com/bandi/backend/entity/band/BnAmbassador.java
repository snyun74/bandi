package com.bandi.backend.entity.band;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BN_AMBASSADOR")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BnAmbassador {

    @Id
    @Column(name = "USER_ID", length = 20, nullable = false)
    private String userId;

    @Column(name = "ACTIVITY_FIELD", length = 100, nullable = false)
    private String activityField;

    @Column(name = "INTRO_CONTENT", columnDefinition = "TEXT", nullable = false)
    private String introContent;

    @Column(name = "PORTFOLIO_URL", length = 1000)
    private String portfolioUrl;

    @Column(name = "SNS_URL", length = 1000)
    private String snsUrl;

    @Column(name = "ATTACH_NO")
    private Long attachNo;

    @Column(name = "APPLY_STAT_CD", length = 20, nullable = false)
    private String applyStatCd; // R: 심사대기, A: 승인완료, J: 반려/거절

    @Column(name = "REJECT_REASON", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "REVIEW_DTIME", length = 14)
    private String reviewDtime;

    @Column(name = "REVIEW_ID", length = 20)
    private String reviewId;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
