package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_PLAN_SCHEDULE_TIME")
@Getter
@Setter
@IdClass(BnPlanScheduleTimeId.class)
public class BnPlanScheduleTime {

    @Id
    @Column(name = "BN_NO")
    private Long bnNo;

    @Id
    @Column(name = "BN_SCH_DATE", length = 8)
    private String bnSchDate;

    @Id
    @Column(name = "BN_USER_ID", length = 20)
    private String bnUserId;

    @Id
    @Column(name = "BN_SCH_TIME", length = 4)
    private String bnSchTime;

    @Column(name = "INS_DTIME", length = 14)
    private String insDtime;

    @Column(name = "INS_ID", length = 20)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20)
    private String updId;
}
