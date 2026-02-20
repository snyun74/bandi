package com.bandi.backend.entity.member;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionSkillId implements Serializable {
    private String userId;
    private String sessionTypeCd;
}
