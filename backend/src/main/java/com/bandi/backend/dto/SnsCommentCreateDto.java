package com.bandi.backend.dto;

import lombok.Data;

@Data
public class SnsCommentCreateDto {
    private String userId;
    private String content;
}
