package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShortsListDto {
    private Long shortsNo;
    private String userId;
    private String userNickNm;
    private String title;
    private String videoPath;
    private String publicTypeCd;
    private String insDtime;
}
