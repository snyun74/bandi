package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BandScheduleDto {
    private Long bnSchNo;
    private Long bnNo;
    private String title;
    private String content;
    private String startDate; // YYYYMMDD
    private String startTime; // HHMM
    private String endDate; // YYYYMMDD
    private String endTime; // HHMM
    private String allDayYn; // Y/N
    private String userId; // For Insert/Update
}
