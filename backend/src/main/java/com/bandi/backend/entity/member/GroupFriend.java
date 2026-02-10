package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_GROUP_FRIEND")
@Getter
@Setter
@IdClass(GroupFriendId.class)
public class GroupFriend {

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Id
    @Column(name = "friend_user_id", length = 20)
    private String friendUserId;

    @Column(name = "cm_group_no", length = 10)
    private String cmGroupNo;

    @Column(name = "friend_stat_cd", length = 20)
    private String friendStatCd;

    @Column(name = "remark", length = 400)
    private String remark;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
