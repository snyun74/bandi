package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPushHistoryDto {
    private Long pushLogNo;
    private String userId;
    private String userNickNm;
    private String userNm;
    private String pushTitle;
    private String pushBody;
    private String linkUrl;
    private String sendStatCd; // "00": 시도, "01": 성공, "02": 실패
    private String readYn;
    private String insDtime;
}
