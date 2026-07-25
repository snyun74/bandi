package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_ROOM")
@Getter
@Setter
public class BnRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_no")
    private Long roomNo;

    @Column(name = "studio_no", nullable = false)
    private Long studioNo;

    @Column(name = "room_nm", length = 200, nullable = false)
    private String roomNm;

    @Column(name = "hour_base_uprice", nullable = false)
    private Integer hourBaseUprice;

    @Column(name = "capacity_cnt", nullable = false)
    private Integer capacityCnt;

    @Column(name = "equipment_info", columnDefinition = "TEXT")
    private String equipmentInfo;

    @Column(name = "room_stat_cd", length = 20, nullable = false)
    private String roomStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
