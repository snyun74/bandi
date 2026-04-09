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
    private String contentPreview;
    private String thumbnailPath;   // 첫 번째 이미지 (썸네일용)
    private List<String> imagePaths; // 전체 이미지 리스트 (피드용)
    private String publicTypeCd;
    private String insDtime;
}
