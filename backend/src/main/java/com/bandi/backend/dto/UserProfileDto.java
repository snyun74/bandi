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
    private String genderCd;
    private String mbti;
    private String adminYn;
    private Boolean skillsConfigured; // false = 세션 실력 미입력
    private String profileImageUrl;
    private Double mannerScore;
    private Integer moodMakerCount;
    private List<UserSkillDto> skills;
}
