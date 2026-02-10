package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClanBoardCreateDto {
    private Long cnNo;
    private Long cnBoardTypeNo;
    private String title;
    private String content;
    private String userId;
    private String youtubeUrl;
}
