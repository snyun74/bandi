package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CommunityBoardCommentDto {
    private Long replyNo;
    private Long boardNo;
    private String content;
    private String replyUserId;
    private String userNickNm;
    private String regDate;
    private Long likeCnt;
    private Boolean isLiked;
    private Long parentReplyNo;
}
