package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CmReportDto {
    private String reportUserId;
    private String targetUserId;
    private String boardUrl;
    private String content;
}
