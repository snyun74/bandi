package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_STUDIO_DIR")
@Getter
@Setter
public class BnStudioDir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dir_no")
    private Long dirNo;

    @Column(name = "studio_nm", length = 200, nullable = false)
    private String studioNm;

    @Column(name = "road_address", length = 400)
    private String roadAddress;

    @Column(name = "jibun_address", length = 400)
    private String jibunAddress;

    @Column(name = "telephone", length = 50)
    private String telephone;

    @Column(name = "category_nm", length = 100)
    private String categoryNm;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "map_x", length = 50)
    private String mapX;

    @Column(name = "map_y", length = 50)
    private String mapY;

    @Column(name = "sido", length = 50)
    private String sido;

    @Column(name = "sigungu", length = 50)
    private String sigungu;

    @Column(name = "dong", length = 50)
    private String dong;

    @Column(name = "source_cd", length = 20)
    private String sourceCd;

    @Column(name = "use_yn", length = 1, nullable = false)
    private String useYn;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 50, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 50)
    private String updId;
}
