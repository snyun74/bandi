package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private String userId;
    private String userNm;
    private String userNickNm;
    private String email;
    private String profileImageUrl; // Full URL or path
    private Double mannerScore;
    private Integer moodMakerCount;
    private List<UserSkillDto> skills;
}
