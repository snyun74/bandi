package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CN_CHAT_MESSAGE_READ")
@IdClass(ClanChatMessageReadId.class)
@Getter
@Setter
public class ClanChatMessageRead {

    @Id
    @Column(name = "CN_MSG_NO")
    private Long cnMsgNo;

    @Id
    @Column(name = "READ_USER_ID", length = 20)
    private String readUserId;

    @Column(name = "READ_DTIME", length = 14, nullable = false)
    private String readDtime;
}
