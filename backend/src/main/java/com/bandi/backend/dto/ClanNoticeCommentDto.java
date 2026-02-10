package com.bandi.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClanNoticeCommentDto {
    private Long cnCommentNo;
    private Long cnNoticeNo;
    private String commentUserId;
    private String userNickNm;
    private Long parentCommentNo;
    private String content;
    private String insDtime;
}
