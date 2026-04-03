package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminJamDto {
    private Long bnNo;
    private String bnType; // CLAN or FREE
    private String clanNm; // CN_NM from CN_GROUP if CLAN
    private String bnNm;
    private String bnSongNm;
    private String bnSingerNm;
    private String bnStatCd; // A(운영), etc.
    private String bnConfFg; // Y(확정) N(미확정) E(종료?) 등... backend에서 매핑
    private String formattedStatus; // "미확정", "확정", "종료", "삭제" 중 1
}
