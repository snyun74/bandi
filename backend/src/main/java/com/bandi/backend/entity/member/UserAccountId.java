package com.bandi.backend.entity.member;

import java.io.Serializable;
import java.util.Objects;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode
public class UserAccountId implements Serializable {
    private String userId;
    private String accountId;

    public UserAccountId() {
    }

    public UserAccountId(String userId, String accountId) {
        this.userId = userId;
        this.accountId = accountId;
    }
}
