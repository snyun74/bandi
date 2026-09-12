package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CnRoomScheduleDto {
    private Long cnSchNo;
    private Long cnNo;
    private Long bnNo;
    private String bnNm;
    private String bnSongNm;
    private String bnSingerNm;
    private String bnImg;
    private String schSttDate;
    private String schSttTime;
    private String schEndDate;
    private String schEndTime;
    private String schStatCd;
    private String insDtime;
    private String insId;
    private String userNickNm;
    private String profileImageUrl;
    private Boolean canDelete;
}
