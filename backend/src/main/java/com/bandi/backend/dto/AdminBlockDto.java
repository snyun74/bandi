package com.bandi.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminBlockDto {
    private String userId;
    private String userNickNm;
    private String blockUserId;
    private String blockUserNickNm;
    private String blockDtime;
}
