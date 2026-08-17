package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_STUDIO_ATTACHMENT")
@IdClass(BnStudioAttachmentId.class)
@Getter
@Setter
public class BnStudioAttachment {

    @Id
    @Column(name = "studio_no")
    private Long studioNo;

    @Id
    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "attach_stat_cd", length = 20, nullable = false)
    private String attachStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
