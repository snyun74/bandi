package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_USER_SESSION_SKILL")
@Getter
@Setter
@IdClass(UserSessionSkillId.class)
public class UserSessionSkill {

    @Id
    @Column(name = "USER_ID", length = 20)
    private String userId;

    @Id
    @Column(name = "SESSION_TYPE_CD", length = 20)
    private String sessionTypeCd;

    @Column(name = "SESSION_SKILL_SCORE")
    private Long sessionSkillScore;

    @Column(name = "INS_DTIME", length = 14)
    private String insDtime;

    @Column(name = "INS_ID", length = 20)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20)
    private String updId;
}
