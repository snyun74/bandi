package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_VOTE")
@Getter
@Setter
public class BnVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_vote_no")
    private Long bnVoteNo;

    @Column(name = "bn_no", nullable = false)
    private Long bnNo;

    @Column(name = "vote_title", nullable = false, length = 200)
    private String voteTitle;

    @Column(name = "vote_desc", columnDefinition = "TEXT", nullable = false)
    private String voteDesc;

    @Column(name = "vote_stat_cd", nullable = false, length = 20)
    private String voteStatCd;

    @Column(name = "vote_std_dtime", nullable = false, length = 14)
    private String voteStdDtime;

    @Column(name = "vote_end_dtime", nullable = false, length = 14)
    private String voteEndDtime;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
