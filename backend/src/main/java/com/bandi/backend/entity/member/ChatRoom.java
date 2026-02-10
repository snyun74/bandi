package com.bandi.backend.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MM_CHAT_ROOM")
@Getter
@Setter
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mm_room_no")
    private Long mmRoomNo;

    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "friend_user_id", length = 20)
    private String friendUserId;

    @Column(name = "del_dtime", length = 14)
    private String delDtime;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
