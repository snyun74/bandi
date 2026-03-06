package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PushTokenRequestDto {
    private String userId;
    private String token;
    private String deviceType; // "WEB", "ANDROID", "IOS"
}
