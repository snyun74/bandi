package com.bandi.backend.entity.clan;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClanChatMessageReadId implements Serializable {
    private Long cnMsgNo;
    private String readUserId;
}
