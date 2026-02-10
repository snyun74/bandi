package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Builder
public class CommunityBoardDetailDto {
    private Long boardNo;
    private String boardTypeFg;
    private String title;
    private String content;
    private String writerUserId;
    private String userNickNm;
    private String regDate;
    private Long likeCnt;
    private Boolean isLiked;
    private String youtubeUrl;
    private String attachFilePath;
    private List<CommunityBoardCommentDto> comments;
}
