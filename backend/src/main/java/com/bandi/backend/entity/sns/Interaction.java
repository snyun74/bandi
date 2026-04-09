package com.bandi.backend.entity.sns;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_INTERACTIONS")
@IdClass(InteractionId.class)
@Getter
@Setter
public class Interaction {

    @Id
    @Column(name = "target_type", length = 20)
    private String targetType;

    @Id
    @Column(name = "target_no")
    private Long targetNo;

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "action_type_fg", nullable = false, length = 1)
    private String actionTypeFg;

    @Column(name = "ins_dtime", nullable = false, length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", nullable = false, length = 14)
    private String updDtime;
}
