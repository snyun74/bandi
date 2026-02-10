package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClanListDto {
    private Long cnNo;
    private String cnNm;
    private String cnDesc;
    private String cnUrl;
    private Long userCnt;
    private String attachFilePath; // Added field for profile image
    private Long unreadChatCount; // Added field for unread chat count
}
