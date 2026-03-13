package com.bandi.backend.entity.cm;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CmGrpChatMessageReadId implements Serializable {
    private Long grpChatMsgNo;
    private String grpChatReadUserId;
}
