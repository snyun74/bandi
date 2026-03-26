package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_BLOCK")
@Getter
@Setter
@IdClass(CmBlockId.class)
public class CmBlock {

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Id
    @Column(name = "block_user_id", length = 20)
    private String blockUserId;

    @Column(name = "block_dtime", nullable = false, length = 14)
    private String blockDtime;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
