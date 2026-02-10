package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_CHAT_MESSAGE")
@Getter
@Setter
public class BandChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bn_msg_no")
    private Long bnMsgNo;

    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "snd_user_id", length = 20)
    private String sndUserId;

    @Column(name = "msg_type_cd", length = 20)
    private String msgTypeCd;

    @Column(name = "msg", columnDefinition = "TEXT")
    private String msg;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "snd_dtime", length = 14)
    private String sndDtime;

    @Column(name = "chat_stat_cd", length = 20)
    private String chatStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
