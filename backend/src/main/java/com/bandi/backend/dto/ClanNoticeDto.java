package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClanNoticeDto {
    private Long cnNoticeNo;
    private Long cnNo;
    private Integer commentCount;
    private String title;
    private String content;
    private String writerUserId;
    private String pinYn;
    private String stdDate;
    private String endDate;
    private String youtubeUrl;
    private String attachFilePath;
    private String insDtime;
}
