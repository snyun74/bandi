package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MatchSwapRequestDto {
    private Long fromRoomNo;
    private String fromUserId; // null if empty slot
    private String fromSessionCd;

    private Long toRoomNo;
    private String toUserId; // null if empty slot
    private String toSessionCd;

    private String userId; // ID of the user performing the swap (for validation/logging)
}
