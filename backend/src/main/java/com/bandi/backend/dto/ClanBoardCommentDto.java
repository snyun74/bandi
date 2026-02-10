package com.bandi.backend.dto;

import lombok.Data;

@Data
public class ClanBoardCommentDto {
    private Long cnReplyNo;
    private Long cnBoardNo;
    private String content;
    private String writerUserId;
    private String userNickNm;
    private String regDate;
    private Long likeCnt;
    private Long childReplyCount;
    private Long likeCount;
    private Long parentReplyNo;
    private Integer depth;
}
