package com.bandi.backend.dto;

import lombok.Data;

@Data
public class PostCreateDto {
    private String userId;
    private String content;
    private String publicTypeCd; // BD007
}
