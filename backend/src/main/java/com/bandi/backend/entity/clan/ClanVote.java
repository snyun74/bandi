package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_VOTE")
@Getter
@Setter
public class ClanVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_vote_no")
    private Long cnVoteNo;

    @Column(name = "cn_no", nullable = false)
    private Long cnNo;

    @Column(name = "vote_title", nullable = false, length = 200)
    private String voteTitle;

    @Column(name = "vote_desc", length = 500)
    private String voteDesc;

    @Column(name = "vote_stat_cd", nullable = false, length = 10)
    private String voteStatCd; // 'A' (Active)

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
