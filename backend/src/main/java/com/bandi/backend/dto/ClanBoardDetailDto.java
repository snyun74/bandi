package com.bandi.backend.dto;

import lombok.Data;

@Data
public class ClanBoardDetailDto {
    private Long cnBoardNo;
    private Long cnBoardTypeNo;
    private String boardTypeNm;
    private String title;
    private String content;
    private String writerUserId;
    private String userNickNm;
    private String regDate;
    private String youtubeUrl;
    private Long viewCnt;
    private Long likeCnt;
    private Long replyCnt;
    private Long scrapCnt;
    private Boolean isScrapped;
    private String attachFilePath;
}
