package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_SHORTS_VIEW")
@IdClass(ShortsViewId.class)
@Getter
@Setter
public class ShortsView {

    @Id
    @Column(name = "shorts_no")
    private Long shortsNo;

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "ins_id", nullable = false, length = 20)
    private String insId;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;

    @Column(name = "upd_id", nullable = false, length = 20)
    private String updId;
}
