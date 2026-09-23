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
    private Long bnNo;
    private String songTitle;
    private String artist;
    private String bnNm;
    private String part; // Will store the decoded name
    private String sessionTypeCd; // Raw code
    private String bnConfFg; // 'N': 진행중, 'Y': 합주확정
    private String joinStatus; // 'JOIN': 참여, 'RSV': 예약대기
}
