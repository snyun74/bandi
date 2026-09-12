package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPushRequestDto {
    private String adminUserId;
    private String targetType; // "INDIVIDUAL", "ANDROID", "IOS", "ALL"
    private String targetUserId; // Optional: used when targetType is "INDIVIDUAL"
    private String title;
    private String body;
    private String linkUrl; // Optional click URL (defaults to /main)
}
