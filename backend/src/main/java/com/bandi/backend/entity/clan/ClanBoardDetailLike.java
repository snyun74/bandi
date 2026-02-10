package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BOARD_DETAIL_LIKE")
@Getter
@Setter
public class ClanBoardDetailLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_board_detail_like_no")
    private Long cnBoardDetailLikeNo;

    @Column(name = "cn_reply_no")
    private Long cnReplyNo;

    @Column(name = "cn_board_no")
    private Long cnBoardNo;

    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
