package com.bandi.backend.entity.cm;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "CM_GRP_CHAT_USER")
@IdClass(CmGrpChatUserId.class)
@Getter
@Setter
public class CmGrpChatUser implements Persistable<CmGrpChatUserId> {

    @Id
    @Column(name = "grp_chat_no")
    private Long grpChatNo;

    @Id
    @Column(name = "user_id", length = 20)
    private String userId;

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
    public CmGrpChatUserId getId() {
        return new CmGrpChatUserId(grpChatNo, userId);
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
