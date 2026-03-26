package com.bandi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportDto {
    private Long reportNo;
    private String reportUserId;
    private String reportUserNickNm;
    private String targetUserId;
    private String targetUserNickNm;
    private String boardUrl;
    private String content;
    private String reportDtime;
    private String procStatFg;
}
