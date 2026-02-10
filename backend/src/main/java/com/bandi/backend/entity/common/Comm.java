package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_COMM")
@Getter
@Setter
public class Comm {

    @Id
    @Column(name = "comm_cd", length = 20)
    private String commCd;

    @Column(name = "comm_nm", length = 100)
    private String commNm;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
