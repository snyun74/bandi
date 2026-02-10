package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BOARD_ATTACHMENT")
@Getter
@Setter
@IdClass(ClanBoardAttachmentId.class)
public class ClanBoardAttachment {

    @Id
    @Column(name = "cn_board_no")
    private Long cnBoardNo;

    @Id
    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "attach_stat_cd", length = 20)
    private String attachStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
