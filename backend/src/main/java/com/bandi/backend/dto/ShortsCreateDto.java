package com.bandi.backend.dto;

import lombok.Data;

@Data
public class ShortsCreateDto {
    private String userId;
    private String title;
    private Integer duration;
    private String publicTypeCd;
}
