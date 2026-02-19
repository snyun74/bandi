package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BOARD_DETAIL_LIKE")
@Getter
@Setter
@IdClass(BoardDetailLikeId.class)
public class BoardDetailLike {

    @Id
    @Column(name = "reply_no")
    private Long replyNo;

    @Id
    @Column(name = "board_no")
    private Long boardNo;

    @Id
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
