package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_SCRAP")
@Getter
@Setter
public class CmScrap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scrap_no")
    private Long scrapNo;

    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "scrap_table_nm", length = 200)
    private String scrapTableNm;

    @Column(name = "scrap_table_pk_no")
    private Long scrapTablePkNo;

    @Column(name = "scrap_date", length = 8)
    private String scrapDate;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
