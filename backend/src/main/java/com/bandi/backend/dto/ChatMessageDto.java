package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDto {
    private Long cnMsgNo;
    private Long cnNo;
    private String sndUserId;
    private String userNickNm; // Need to join with CN_MEM or User
    private String msg;
    private String msgTypeCd;
    private String sndDtime; // yyyyMMddHHmmss
    private String userProfileUrl; // Attach file path from User or Clan Member
    private boolean isMyMessage;
    private int unreadCount;
    private Long parentMsgNo;
    private String parentMsgContent;
    private String parentMsgUserNickNm;
    private Long attachNo;
    private String attachFilePath;
    private String attachFileName;
    private Long voteNo;
}
