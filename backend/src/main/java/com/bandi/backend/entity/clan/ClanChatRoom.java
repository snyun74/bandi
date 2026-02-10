package com.bandi.backend.entity.clan;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "CN_CHAT_ROOM")
@Getter
@Setter
public class ClanChatRoom implements Persistable<Long> {

    @Id
    @Column(name = "cn_no")
    private Long cnNo; // PK derived from group? Schema says cn_no is int8. Assuming 1:1 with group or
                       // similar.

    @Column(name = "cn_room_nm", length = 200)
    private String cnRoomNm;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;

    @Transient
    private boolean isNew = true;

    @Override
    public Long getId() {
        return cnNo;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PrePersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }
}
