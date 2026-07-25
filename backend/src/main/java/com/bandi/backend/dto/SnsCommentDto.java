package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SnsCommentDto {
    private Long replyNo;
    private Long targetId;
    private String replyUserId;
    private String replyUserNickNm;
    private String replyUserProfileImagePath; // 댓글 작성자 프로필 이미지 경로
    private String content;
    private String insDtime;
}
