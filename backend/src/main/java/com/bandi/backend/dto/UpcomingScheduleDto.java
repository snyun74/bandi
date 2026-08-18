package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpcomingScheduleDto {
    private String type; // "RESERVATION" or "SCHEDULE"
    private Long jamId;
    private String jamTitle;
    private String songTitle;
    private String artist;
    private String dDay; // "D-6", "D-DAY"
    private String dateStr; // "7월 20일 (일) 오후 06:30"
    private String studioName; // "홍대 사운드랩"
    private String statusLabel; // "예약 확정" or "일정 조율 완료"
    private Integer participantCount; // 5
    private String targetDate; // YYYYMMDD
    private String isClan; // "Y" or "N"
}
