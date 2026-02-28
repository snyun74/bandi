package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GatheringMatchMemberDto {
    private Long resultNo;
    private String userId;
    private String userNickNm;
    private String sessionTypeCd;
    private String sessionTypeNm;
    private Integer skillScore;
    private String userGenderCd;
    private String userMbti;
}
