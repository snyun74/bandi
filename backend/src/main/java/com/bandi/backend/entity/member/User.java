package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_USER")
@Getter
@Setter
public class User {
    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "user_nm", length = 100)
    private String userNm;

    @Column(name = "user_nick_nm", length = 100)
    private String userNickNm;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone_no", length = 20)
    private String phoneNo;

    @Column(name = "birth_day", length = 8)
    private String birthDay;

    @Column(name = "gender_cd", length = 20)
    private String genderCd;

    @Column(name = "user_stat_cd", length = 20)
    private String userStatCd;

    @Column(name = "join_day", length = 8)
    private String joinDay;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
