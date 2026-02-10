package com.bandi.backend.entity.member;

import lombok.Data;
import java.io.Serializable;

@Data
public class GroupFriendId implements Serializable {
    private String userId;
    private String friendUserId;
}
