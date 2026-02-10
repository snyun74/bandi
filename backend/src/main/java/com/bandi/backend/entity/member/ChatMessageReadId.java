package com.bandi.backend.entity.member;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageReadId implements Serializable {
    private Long mmMsgNo;
    private String readUserId;
}
