package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillDto {
    private String sessionTypeCd; // Common Code (BD100)
    private String sessionTypeNm; // Common Code Name
    private Long score; // Skill Score (1-5)
}
