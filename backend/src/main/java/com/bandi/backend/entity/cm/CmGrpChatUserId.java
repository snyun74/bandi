package com.bandi.backend.entity.cm;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CmGrpChatUserId implements Serializable {
    private Long grpChatNo;
    private String userId;
}
