package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "MM_CHAT_MESSAGE_READ")
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

    public ChatMessageRead() {
    }

    public ChatMessageRead(Long mmMsgNo, String readUserId, String readDtime) {
        this.mmMsgNo = mmMsgNo;
        this.readUserId = readUserId;
        this.readDtime = readDtime;
    }

    public ChatMessageReadId getId() {
        return new ChatMessageReadId(mmMsgNo, readUserId);
    }

    public Long getMmMsgNo() {
        return mmMsgNo;
    }

    public void setMmMsgNo(Long mmMsgNo) {
        this.mmMsgNo = mmMsgNo;
    }

    public String getReadUserId() {
        return readUserId;
    }

    public void setReadUserId(String readUserId) {
        this.readUserId = readUserId;
    }

    public String getReadDtime() {
        return readDtime;
    }

    public void setReadDtime(String readDtime) {
        this.readDtime = readDtime;
    }
}
