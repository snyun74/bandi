package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class QaResponseDto {
    private Long qaNo;
    private String userId;
    private String userNickNm;
    private String crdDate;
    private String title;
    private String content;
    private Long parentQaNo;
    private String qaStatCd;
    private String insDtime;
    private boolean hasAnswer;
    private List<QaResponseDto> comments; // For answers
    private int likeCount; // UI requested likes, actually the screenshot shows like and comment count for
                           // generic posts. We will mock or provide 0 for now if they are just QAs.
    private int commentCount;
}
