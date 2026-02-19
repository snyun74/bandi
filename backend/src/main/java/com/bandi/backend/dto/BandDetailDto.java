package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Getter
@Setter
@Builder
public class BandDetailDto {
    private Long id;
    private String title;
    private String songTitle;
    private String artist;
    private String description;
    @JsonProperty("isSecret")
    private boolean isSecret;
    @JsonProperty("isLeader")
    private boolean isLeader; // True if current user is leader
    @JsonProperty("isConfirmed")
    private boolean isConfirmed; // bnConfFg == 'Y'
    @JsonProperty("canManage")
    private boolean canManage;
    private String status; // True if user can manage the band (Leader/Executive)
    private String imgUrl;
    private List<ClanJamListDto.JamRoleDto> roles;
}
