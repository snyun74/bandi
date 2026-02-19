package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_CHAT_MESSAGE")
@Getter
@Setter
public class ClanChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cn_msg_no")
    private Long cnMsgNo;

    @Column(name = "cn_no", nullable = false)
    private Long cnNo;

    @Column(name = "snd_user_id", length = 20, nullable = false)
    private String sndUserId;

    @Column(name = "msg_type_cd", length = 20, nullable = false)
    private String msgTypeCd;

    @Column(name = "msg", columnDefinition = "TEXT", nullable = false)
    private String msg;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "snd_dtime", length = 14, nullable = false)
    private String sndDtime;

    @Column(name = "chat_stat_cd", length = 20, nullable = false)
    private String chatStatCd;

    @Column(name = "parent_msg_no")
    private Long parentMsgNo;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "vote_no")
    private Long voteNo;
}
