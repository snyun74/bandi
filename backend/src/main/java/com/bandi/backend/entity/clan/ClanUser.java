package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_USER")
@Getter
@Setter
@IdClass(ClanUserId.class)
public class ClanUser {

    @Id
    @Column(name = "cn_no")
    private Long cnNo;

    @Id
    @Column(name = "cn_user_id", length = 20)
    private String cnUserId;

    @Column(name = "cn_user_role_cd", length = 20, nullable = false)
    private String cnUserRoleCd;

    @Column(name = "cn_join_date", length = 8)
    private String cnJoinDate;

    @Column(name = "cn_user_stat_cd", length = 20, nullable = false)
    private String cnUserStatCd;

    @Column(name = "cn_user_appr_stat_cd", length = 20, nullable = false)
    private String cnUserApprStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
