package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BOARD")
@Getter
@Setter
public class ClanBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_board_no")
    private Long cnBoardNo;

    @Column(name = "cn_no")
    private Long cnNo;

    @Column(name = "cn_board_type_no")
    private Long cnBoardTypeNo;

    @Column(name = "writer_user_id", length = 20)
    private String writerUserId;

    @Column(name = "title", length = 400)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

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

    @Column(name = "youtube_url", length = 500)
    private String youtubeUrl;

    @Column(name = "reg_date", length = 8)
    private String regDate;
}
