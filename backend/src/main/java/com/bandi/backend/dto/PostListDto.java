package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PostListDto {
    private Long postId;
    private String userId;
    private String userNickNm;
    private String userProfileImagePath; // 작성자 프로필 이미지 경로
    private String contentPreview;
    private String thumbnailPath;   // 첫 번째 이미지 (썸네일용)
    private List<String> imagePaths; // 전체 이미지 리스트 (피드용)
    private String publicTypeCd;
    private String insDtime;

    // 추가된 통계 및 액션 정보
    private long viewCount;
    private long likeCount;
    private long dislikeCount;
    private String userAction; // "L" (좋아요), "D" (별루예요), or null
    private long commentCount;
}
