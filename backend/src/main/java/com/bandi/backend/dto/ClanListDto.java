package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClanListDto {
    private Long cnNo;
    private String cnNm;
    private String cnDesc;
    private String cnUrl;
    private Long userCnt;
    private String attachFilePath; // Added field for profile image
    private Long unreadChatCount; // Added field for unread chat count
    private String roomUseYn; // Added field for room reservation usage
    private String roomSttTime; // Added field for room start time (e.g. "08")
    private String roomEndTime; // Added field for room end time (e.g. "22")

    public ClanListDto(Long cnNo, String cnNm, String cnDesc, String cnUrl, Long userCnt, String attachFilePath, Long unreadChatCount) {
        this.cnNo = cnNo;
        this.cnNm = cnNm;
        this.cnDesc = cnDesc;
        this.cnUrl = cnUrl;
        this.userCnt = userCnt;
        this.attachFilePath = attachFilePath;
        this.unreadChatCount = unreadChatCount;
        this.roomUseYn = "N";
    }

    public ClanListDto(Long cnNo, String cnNm, String cnDesc, String cnUrl, Long userCnt, String attachFilePath, Long unreadChatCount, String roomUseYn) {
        this.cnNo = cnNo;
        this.cnNm = cnNm;
        this.cnDesc = cnDesc;
        this.cnUrl = cnUrl;
        this.userCnt = userCnt;
        this.attachFilePath = attachFilePath;
        this.unreadChatCount = unreadChatCount;
        this.roomUseYn = roomUseYn != null ? roomUseYn : "N";
    }

    public ClanListDto(Long cnNo, String cnNm, String cnDesc, String cnUrl, Long userCnt, String attachFilePath, Long unreadChatCount, String roomUseYn, String roomSttTime, String roomEndTime) {
        this.cnNo = cnNo;
        this.cnNm = cnNm;
        this.cnDesc = cnDesc;
        this.cnUrl = cnUrl;
        this.userCnt = userCnt;
        this.attachFilePath = attachFilePath;
        this.unreadChatCount = unreadChatCount;
        this.roomUseYn = roomUseYn != null ? roomUseYn : "N";
        this.roomSttTime = roomSttTime;
        this.roomEndTime = roomEndTime;
    }
}
