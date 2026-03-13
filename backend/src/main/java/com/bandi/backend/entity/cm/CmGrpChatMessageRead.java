package com.bandi.backend.entity.cm;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "CM_GRP_CHAT_MESSAGE_READ")
@IdClass(CmGrpChatMessageReadId.class)
@Getter
@Setter
public class CmGrpChatMessageRead implements Persistable<CmGrpChatMessageReadId> {

    @Id
    @Column(name = "grp_chat_msg_no")
    private Long grpChatMsgNo;

    @Id
    @Column(name = "grp_chat_read_user_id", length = 20)
    private String grpChatReadUserId;

    @Column(name = "grp_chat_read_dtime", length = 14, nullable = false)
    private String grpChatReadDtime;

    @Transient
    private boolean isNew = true;

    @Override
    public CmGrpChatMessageReadId getId() {
        return new CmGrpChatMessageReadId(grpChatMsgNo, grpChatReadUserId);
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
