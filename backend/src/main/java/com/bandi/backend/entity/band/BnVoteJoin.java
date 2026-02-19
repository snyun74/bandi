package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_VOTE_JOIN")
@Getter
@Setter
@IdClass(BnVoteJoinId.class)
public class BnVoteJoin {

    @Id
    @Column(name = "bn_vote_no")
    private Long bnVoteNo;

    @Id
    @Column(name = "bn_vote_user_id", length = 20)
    private String bnVoteUserId;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
