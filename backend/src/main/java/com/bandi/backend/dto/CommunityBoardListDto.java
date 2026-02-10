package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
public class CommunityBoardListDto {
    private Long boardNo;
    private String boardTypeFg;
    private String title;
    private String regDate;
    private String writerUserId;
    private String userNickNm;
    private Long likeCnt;
    private Long commentCnt;
    private Boolean isLiked;
}
