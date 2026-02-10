package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageCreateDto {
    private Long cnNo;
    private String sndUserId;
    private String msg;
    private String msgTypeCd; // TEXT or FILE
    private Long attachNo; // Optional
    private Long parentMsgNo; // Optional (Reply)
    private Long voteNo; // Optional (Vote)
}
