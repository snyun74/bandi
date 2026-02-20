package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendResponseDto {
    private String userId; // 친구 ID
    private String userNm; // 친구 이름
    private String userNickNm; // 친구 닉네임
    private String profileUrl; // 프로필 이미지 URL (User 엔티티에 있다면 추가)
    private Long unreadCount; // 읽지 않은 메시지 건수
}
