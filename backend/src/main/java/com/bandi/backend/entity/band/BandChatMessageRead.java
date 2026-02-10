package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_CHAT_MESSAGE_READ")
@jakarta.persistence.IdClass(BandChatMessageReadId.class)
@Getter
@Setter
public class BandChatMessageRead {

    @Id
    @Column(name = "bn_msg_no")
    private Long bnMsgNo;

    @Id
    @Column(name = "read_user_id", length = 20)
    private String readUserId;

    @Column(name = "read_dtime", length = 14)
    private String readDtime;
}
