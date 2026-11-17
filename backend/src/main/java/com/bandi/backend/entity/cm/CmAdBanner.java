package com.bandi.backend.entity.cm;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통) 광고/배너정보 (CM_AD_BANNER)
 * - AD_BANNER_NO : 배너 고유번호 (BIGSERIAL)
 * - AD_BANNER_CD : 배너 위치코드 (예: MAIN) - 위치별로 여러 배너 등록 가능
 */
@Entity
@Table(name = "CM_AD_BANNER")
@Getter
@Setter
public class CmAdBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ad_banner_no")
    private Long adBannerNo;

    @Column(name = "ad_banner_cd", length = 20, nullable = false)
    private String adBannerCd;

    @Column(name = "ad_banner_nm", length = 400, nullable = false)
    private String adBannerNm;

    @Column(name = "attach_no", nullable = false)
    private Long attachNo;

    @Column(name = "ad_banner_link_url", length = 400)
    private String adBannerLinkUrl;

    // 링크이동구분 (I:내부화면, O:외부링크)
    @Column(name = "link_target_fg", length = 1, nullable = false)
    private String linkTargetFg;

    @Column(name = "sort_seq", nullable = false)
    private Integer sortSeq;

    // 노출시작일자 (YYYYMMDD)
    @Column(name = "stt_date", length = 8, nullable = false)
    private String sttDate;

    // 노출종료일자 (YYYYMMDD)
    @Column(name = "end_date", length = 8, nullable = false)
    private String endDate;

    @Column(name = "use_yn", length = 1, nullable = false)
    private String useYn;

    // 배너상태코드 (BD004)
    @Column(name = "banner_stat_cd", length = 20, nullable = false)
    private String bannerStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
