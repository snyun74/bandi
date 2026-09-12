package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibleClanJamDto {
    private Long bnNo;
    private Long cnNo;
    private String bnNm;
    private String bnSongNm;
    private String bnSingerNm;
    private String bnConfFg; // 'N': 진행, 'Y': 확정
    private String bnImg;
    private String role;
}
