package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@Getter
@Setter
@Builder
public class ClanJamListDto {
    private Long id;
    private String title;
    private String songTitle;
    private String artist;
    private boolean isSecret;
    @JsonProperty("isMember")
    private boolean isMember;
    @JsonProperty("isConfirmed")
    private boolean isConfirmed;
    @JsonProperty("status")
    private String status;
    private String description;
    private List<JamRoleDto> roles;
    private boolean isFull; // For sorting convenience

    @Getter
    @Setter
    @Builder
    public static class JamRoleDto {
        private Long sessionNo;
        private String sessionTypeCd;
        private String part; // e.g., "보컬", "드럼" (Derived from CommDetail Name or Session Type)
        private String user; // Nickname of the user occupying the slot
        private String status; // 'empty', 'occupied', 'reserved'
        private int reservedCount; // Logic for this might need to be defined, for now 0
        @JsonProperty("isCurrentUser")
        private boolean isCurrentUser;
        @JsonProperty("isBandLeader")
        private boolean isBandLeader;
        private String userId;
    }
}
