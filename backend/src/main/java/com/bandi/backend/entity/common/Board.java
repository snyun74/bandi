package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BOARD")
@Getter
@Setter
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_no")
    private Long boardNo;

    @Column(name = "board_cd", length = 20)
    private String boardCd;

    @Column(name = "writer_user_id", length = 20)
    private String writerUserId;

    @Column(name = "title", length = 400)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "board_type_fg", length = 20)
    private String boardTypeFg;

    @Column(name = "youtube_url", length = 255)
    private String youtubeUrl;

    @Column(name = "board_stat_cd", length = 20)
    private String boardStatCd;

    @Column(name = "pin_yn", length = 1)
    private String pinYn;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
