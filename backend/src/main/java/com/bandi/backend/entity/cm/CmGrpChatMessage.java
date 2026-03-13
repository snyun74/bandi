package com.bandi.backend.entity.cm;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "CM_GRP_CHAT_MESSAGE")
@Getter
@Setter
public class CmGrpChatMessage implements Persistable<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grp_chat_msg_no")
    private Long grpChatMsgNo;

    @Column(name = "grp_chat_no", nullable = false)
    private Long grpChatNo;

    @Column(name = "grp_chat_snd_user_id", length = 20, nullable = false)
    private String grpChatSndUserId;

    @Column(name = "grp_chat_msg_type_cd", length = 20, nullable = false)
    private String grpChatMsgTypeCd;

    @Column(name = "grp_chat_msg", columnDefinition = "TEXT", nullable = false)
    private String grpChatMsg;

    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "grp_chat_snd_dtime", length = 14, nullable = false)
    private String grpChatSndDtime;

    @Column(name = "parent_msg_no")
    private Long parentMsgNo;

    @Column(name = "grp_chat_stat_cd", length = 20, nullable = false)
    private String grpChatStatCd;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Transient
    private boolean isNew = true;

    @Override
    public Long getId() {
        return grpChatMsgNo;
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
