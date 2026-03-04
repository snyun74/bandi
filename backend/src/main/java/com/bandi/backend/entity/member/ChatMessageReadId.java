package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ChatMessageReadId implements Serializable {
    private static final long serialVersionUID = 1L;

    @Column(name = "mm_msg_no")
    private Long mmMsgNo;

    @Column(name = "read_user_id", length = 20)
    private String readUserId;

    public ChatMessageReadId() {
    }

    public ChatMessageReadId(Long mmMsgNo, String readUserId) {
        this.mmMsgNo = mmMsgNo;
        this.readUserId = readUserId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        ChatMessageReadId that = (ChatMessageReadId) o;
        return Objects.equals(mmMsgNo, that.mmMsgNo) &&
                Objects.equals(readUserId, that.readUserId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(mmMsgNo, readUserId);
    }
}
