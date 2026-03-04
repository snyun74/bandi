package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "MM_CHAT_MESSAGE_READ")
public class ChatMessageRead {

    @EmbeddedId
    private ChatMessageReadId id;

    @Column(name = "read_dtime", length = 14)
    private String readDtime;

    public ChatMessageRead() {
    }

    public ChatMessageRead(ChatMessageReadId id, String readDtime) {
        this.id = id;
        this.readDtime = readDtime;
    }

    public ChatMessageReadId getId() {
        return id;
    }

    public void setId(ChatMessageReadId id) {
        this.id = id;
    }

    public String getReadDtime() {
        return readDtime;
    }

    public void setReadDtime(String readDtime) {
        this.readDtime = readDtime;
    }
}
