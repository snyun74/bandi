package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClanScheduleDto {
    private Long cnSchNo;
    private Long cnNo;
    private String title;
    private String content;
    private String sttDate; // YYYYMMDD
    private String sttTiem; // HHMMSS
    private String endDate; // YYYYMMDD
    private String endTime; // HHMMSS
    private String allDayYn; // Y/N
    private String schStatCd; // Active/etc
    private String insId;
}
