package com.bandi.backend.entity.cm;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "CM_GRP_CHAT_ROOM")
@Getter
@Setter
public class CmGrpChatRoom implements Persistable<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grp_chat_no")
    private Long grpChatNo;

    @Column(name = "grp_chat_room_nm", length = 200, nullable = false)
    private String grpChatRoomNm;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;

    @Transient
    private boolean isNew = true;

    @Override
    public Long getId() {
        return grpChatNo;
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
