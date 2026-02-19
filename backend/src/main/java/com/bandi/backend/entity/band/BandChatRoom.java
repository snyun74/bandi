package com.bandi.backend.entity.band;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "BN_CHAT_ROOM")
@Getter
@Setter
public class BandChatRoom {

    @Id
    @Column(name = "bn_no")
    private Long bnNo;

    @Column(name = "bn_room_nm", length = 200, nullable = false)
    private String bnRoomNm;

    @Column(name = "ins_dtime", length = 14, nullable = false)
    private String insDtime;

    @Column(name = "ins_id", length = 20, nullable = false)
    private String insId;

    @Column(name = "upd_dtime", length = 14, nullable = false)
    private String updDtime;

    @Column(name = "upd_id", length = 20, nullable = false)
    private String updId;
}
