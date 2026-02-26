package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_BN_GATHER_WEIGHT")
@Getter
@Setter
public class ClanGatherWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "WEIGHT_NO")
    private Long weightNo;

    @Column(name = "GATHER_NO", nullable = false)
    private Long gatherNo;

    @Column(name = "GATHER_TYPE_CD", length = 20, nullable = false)
    private String gatherTypeCd;

    @Column(name = "WEIGHT_VALUE", nullable = false)
    private Integer weightValue;

    @Column(name = "BALANCE_APPLY_YN", length = 1, nullable = false)
    private String balanceApplyYn;

    @Column(name = "INS_DTIME", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "INS_ID", length = 20, nullable = false)
    private String insId;

    @Column(name = "UPD_DTIME", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "UPD_ID", length = 20, nullable = false)
    private String updId;
}
