package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_USER_ACCOUNT")
@Getter
@Setter
@IdClass(UserAccountId.class)
public class UserAccount {
    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Id
    @Column(name = "account_id", length = 200)
    private String accountId;

    @Column(name = "login_type_cd", length = 20)
    private String loginTypeCd;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "passwd", length = 255)
    private String passwd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
