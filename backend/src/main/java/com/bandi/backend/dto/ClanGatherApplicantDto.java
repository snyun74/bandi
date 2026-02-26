package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ClanGatherApplicantDto {
    private String userId;
    private String userNickNm;
    private String sessionTypeNm1st;
    private Integer session1stScore;
    private String sessionTypeNm2nd;
    private Integer session2ndScore;
    private String mbti;
    private String gender;
}
