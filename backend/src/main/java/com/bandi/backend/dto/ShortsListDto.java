package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShortsListDto {
    private Long shortsNo;
    private String userId;
    private String userNickNm;
    private String userProfileImagePath; // 작성자 프로필 이미지 경로
    private String title;
    private String videoPath;
    private String publicTypeCd;
    private String insDtime;

    // 추가된 통계 및 액션 정보
    private long viewCount;
    private long likeCount;
    private long dislikeCount;
    private String userAction; // "L" (좋아요), "D" (별루예요), or null
    private long commentCount;
}
