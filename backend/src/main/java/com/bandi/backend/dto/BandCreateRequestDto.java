package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class BandCreateRequestDto {
    private Long clanId;
    private String title;
    private String songTitle;
    private String artist;
    private String description;
    private boolean secret;
    private String password;
    private String userId;
    private List<String> sessions;
    private Long attachNo;
}
