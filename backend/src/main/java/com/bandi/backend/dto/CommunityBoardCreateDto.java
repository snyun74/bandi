package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityBoardCreateDto {
    private Long boardNo; // For update if needed, typically null on create
    private String boardTypeFg;
    private String title;
    private String content;
    private String userId;
    private String youtubeUrl;
}
