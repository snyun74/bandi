package com.bandi.backend.dto;

import lombok.Data;

@Data
public class QaRequestDto {
    private String userId;
    private String title;
    private String content;
    private Long parentQaNo;
    private Long attachNo;
}
