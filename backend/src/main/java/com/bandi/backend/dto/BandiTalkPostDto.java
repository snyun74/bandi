package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BandiTalkPostDto {
    private Long boardNo;
    private String boardTypeFg;
    private String title;
    private String content;
    private String regDate;
    private String writerUserId;
    private String userNickNm;
    private String profileImg;
    private String maskingYn;
    private Long likeCnt;
    private Long commentCnt;
}
