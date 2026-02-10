package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BOARD_DETAIL_LIKE")
@Getter
@Setter
public class BoardDetailLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_detail_like_no")
    private Long boardDetailLikeNo;

    @Column(name = "reply_no")
    private Long replyNo;

    @Column(name = "board_no")
    private Long boardNo;

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
