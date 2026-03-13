package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private String userId;
    private String userNm;
    private String userNickNm;
    private String joinDay;
    private String userStatCd;
    private String profileImageUrl;
    private String insDtime;
}
