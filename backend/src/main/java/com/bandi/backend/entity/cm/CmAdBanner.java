package com.bandi.backend.entity.cm;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_AD_BANNER")
@Getter
@Setter
public class CmAdBanner {

    @Id
    @Column(name = "ad_banner_cd", length = 20)
    private String adBannerCd;

    @Column(name = "ad_banner_nm", length = 400, nullable = false)
    private String adBannerNm;

    @Column(name = "attach_no", nullable = false)
    private Long attachNo;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;

    @Column(name = "ad_banner_link_url", length = 1000)
    private String adBannerLinkUrl;
}
