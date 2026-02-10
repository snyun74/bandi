package com.bandi.backend.entity.band;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BandChatMessageReadId implements Serializable {
    private Long bnMsgNo;
    private String readUserId;
}
