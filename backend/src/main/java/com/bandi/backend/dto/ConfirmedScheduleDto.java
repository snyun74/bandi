package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmedScheduleDto {
    private Long schNo;
    private Long bnNo;
    private String title;
    private String content;
    private String sttDate; // YYYYMMDD
    private String sttTime; // HHMM or HHMMSS
    private String endDate; // YYYYMMDD
    private String endTime; // HHMM or HHMMSS
    private String allDayYn; // Y/N
    private String statCd; // A
    private String userId; // 등록자
}
