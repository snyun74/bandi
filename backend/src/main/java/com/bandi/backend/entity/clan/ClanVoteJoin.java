package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_VOTE_JOIN")
@Getter
@Setter
@IdClass(ClanVoteJoinId.class)
public class ClanVoteJoin {

    @Id
    @Column(name = "cn_vote_no")
    private Long cnVoteNo;

    @Id
    @Column(name = "cn_vote_user_id", length = 20)
    private String cnVoteUserId;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
