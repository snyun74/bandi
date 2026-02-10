package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityBoardCommentCreateDto {
    private String userId;
    private String content;
    private Long parentReplyNo;
}
