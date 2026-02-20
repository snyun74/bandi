package com.bandi.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserProfileUpdateDto {
    private String userId;
    private String userNickNm;
    private String email;
    private List<UserSkillDto> skills;
}
