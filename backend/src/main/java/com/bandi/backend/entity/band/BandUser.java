package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_USER")
@Getter
@Setter
public class BandUser {

    @Id
    @Column(name = "bn_no")
    private Long bnNo;

    @Id
    @Column(name = "bn_user_id", length = 20)
    private String bnUserId;

    @Column(name = "bn_session_no")
    private Long bnSessionNo;

    @Column(name = "bn_user_role_cd", length = 20)
    private String bnUserRoleCd;

    @Column(name = "bn_join_date", length = 8)
    private String bnJoinDate;

    @Column(name = "bn_user_stat_cd", length = 20)
    private String bnUserStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
