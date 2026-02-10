package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "CN_BOARD_TYPE")
@Getter
@Setter
public class ClanBoardType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_board_type_no")
    private Long cnBoardTypeNo;

    @Column(name = "cn_no")
    private Long cnNo;

    @Column(name = "cn_board_type_nm", length = 100)
    private String cnBoardTypeNm;

    @Column(name = "board_type_stat_cd", length = 20)
    private String boardTypeStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;

    @PrePersist
    public void prePersist() {
        this.insDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        this.boardTypeStatCd = "A"; // Default Active
    }

    @PreUpdate
    public void preUpdate() {
        this.updDtime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
