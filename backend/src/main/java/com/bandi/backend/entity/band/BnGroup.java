package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_GROUP")
@Getter
@Setter
public class BnGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BN_NO")
    private Long bnNo;

    @Column(name = "BN_TYPE", length = 20, nullable = false)
    private String bnType;

    @Column(name = "CN_NO")
    private Long cnNo;

    @Column(name = "BN_NM", length = 100, nullable = false)
    private String bnNm;

    @Column(name = "BN_SONG_NM", length = 100, nullable = false)
    private String bnSongNm;

    @Column(name = "BN_SINGER_NM", length = 100, nullable = false)
    private String bnSingerNm;

    @Column(name = "BN_PASSWD_FG", length = 1, nullable = false)
    private String bnPasswdFg;

    @Column(name = "BN_PASSWD", length = 100)
    private String bnPasswd;

    @Column(name = "BN_DESC", length = 4000, nullable = false)
    private String bnDesc;

    @Column(name = "BN_CONF_FG", length = 1, nullable = false)
    private String bnConfFg;

    @Column(name = "BN_LEADER_ID", length = 20, nullable = false)
    private String bnLeaderId;

    @Column(name = "BN_STAT_CD", length = 20, nullable = false)
    private String bnStatCd;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;

    @Column(name = "ATTACH_NO")
    private Long attachNo;
}
