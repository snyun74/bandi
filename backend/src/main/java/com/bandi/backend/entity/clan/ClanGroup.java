package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_GROUP")
@Getter
@Setter
public class ClanGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_no")
    private Long cnNo;

    @Column(name = "cn_nm", length = 100)
    private String cnNm;

    @Column(name = "cn_desc", columnDefinition = "TEXT")
    private String cnDesc;

    @Column(name = "cn_url", length = 500)
    private String cnUrl;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "cn_owd_user_id", length = 20)
    private String cnOwdUserId;

    @Column(name = "cn_appr_stat_cd", length = 20)
    private String cnApprStatCd;

    @Column(name = "cn_stat_cd", length = 20)
    private String cnStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
