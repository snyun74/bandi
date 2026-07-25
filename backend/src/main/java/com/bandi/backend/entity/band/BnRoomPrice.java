package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_ROOM_PRICE")
@Getter
@Setter
public class BnRoomPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_no")
    private Long priceNo;

    @Column(name = "room_no", nullable = false)
    private Long roomNo;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "stt_time", length = 4, nullable = false)
    private String sttTime;

    @Column(name = "end_time", length = 4, nullable = false)
    private String endTime;

    @Column(name = "time_uprice", nullable = false)
    private Integer timeUprice;

    @Column(name = "price_stat_cd", length = 20, nullable = false)
    private String priceStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
