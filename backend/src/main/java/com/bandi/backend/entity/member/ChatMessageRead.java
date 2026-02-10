package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_CHAT_MESSAGE_READ")
@Getter
@Setter
@IdClass(ChatMessageReadId.class)
public class ChatMessageRead {

    @Id
    @Column(name = "mm_msg_no")
    private Long mmMsgNo;

    @Id
    @Column(name = "read_user_id", length = 20)
    private String readUserId;

    @Column(name = "read_dtime", length = 14)
    private String readDtime;
}
