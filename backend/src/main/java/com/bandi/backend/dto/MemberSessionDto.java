package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberSessionDto {
    private String userId;
    private String songTitle;
    private String artist;
    private String part; // Will store the decoded name
    private String sessionTypeCd; // Raw code
}
