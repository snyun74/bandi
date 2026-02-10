package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_CHAT_MESSAGE")
@Getter
@Setter
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mm_msg_no")
    private Long mmMsgNo;

    @Column(name = "mm_room_no")
    private Long mmRoomNo;

    @Column(name = "snd_user_id", length = 20)
    private String sndUserId;

    @Column(name = "rcv_user_id", length = 20)
    private String rcvUserId;

    @Column(name = "msg_type_cd", length = 20)
    private String msgTypeCd;

    @Column(name = "msg", columnDefinition = "TEXT")
    private String msg;

    @Column(name = "snd_dtime", length = 14)
    private String sndDtime;

    @Column(name = "chat_stat_cd", length = 20)
    private String chatStatCd;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "parent_mm_msg_no")
    private Long parentMmMsgNo;
}
