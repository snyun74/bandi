package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_COMM_DETAIL")
@Getter
@Setter
@IdClass(CommDetailId.class)
public class CommDetail {

    @Id
    @Column(name = "comm_cd", length = 20)
    private String commCd;

    @Id

    @Column(name = "COMM_DETAIL_CD", length = 20)
    private String commDtlCd;

    @Column(name = "COMM_DETAIL_NM", length = 100)
    private String commDtlNm;

    @Column(name = "comm_order")
    private Integer commOrder;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
