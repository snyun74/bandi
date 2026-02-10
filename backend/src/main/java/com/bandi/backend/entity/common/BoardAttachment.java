package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BOARD_ATTACHMENT")
@Getter
@Setter
@IdClass(BoardAttachmentId.class)
public class BoardAttachment {

    // Composite Key candidate (board_no, attach_no)
    @Id
    @Column(name = "board_no")
    private Long boardNo;

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
