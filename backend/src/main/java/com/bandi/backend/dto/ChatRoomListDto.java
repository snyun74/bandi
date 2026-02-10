package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomListDto {
    private Long roomNo;
    private String roomNm;
    private String newMsg;
    private Integer newMsgReadCnt;
    private String roomType; // "CLAN" or "BAND"
    private String attachFilePath;
}
