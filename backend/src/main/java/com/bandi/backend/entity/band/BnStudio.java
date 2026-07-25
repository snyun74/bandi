package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_STUDIO")
@Getter
@Setter
public class BnStudio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "studio_no")
    private Long studioNo;

    @Column(name = "partner_no", nullable = false)
    private Long partnerNo;

    @Column(name = "studio_nm", length = 200, nullable = false)
    private String studioNm;

    @Column(name = "address", length = 400)
    private String address;

    @Column(name = "zipcode", length = 20)
    private String zipcode;

    @Column(name = "bigo", columnDefinition = "TEXT")
    private String bigo;

    @Column(name = "studio_stat_cd", length = 20, nullable = false)
    private String studioStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
