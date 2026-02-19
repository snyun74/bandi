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
    @Column(name = "BN_CHAT_MSG_NO")
    private Long bnMsgNo;

    @Column(name = "BN_NO", nullable = false)
    private Long bnNo;

    @Column(name = "bn_chat_snd_user_id", length = 20, nullable = false)
    private String sndUserId;

    @Column(name = "bn_chat_msg_type_cd", length = 20, nullable = false)
    private String msgTypeCd;

    @Column(name = "bn_chat_msg", columnDefinition = "TEXT", nullable = false)
    private String msg;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "bn_chat_snd_dtime", length = 14, nullable = false)
    private String sndDtime;

    @Column(name = "bn_chat_stat_cd", length = 20, nullable = false)
    private String chatStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "parent_msg_no")
    private Long parentMsgNo;

}
