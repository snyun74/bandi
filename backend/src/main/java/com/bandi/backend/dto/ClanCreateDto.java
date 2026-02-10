package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClanCreateDto {
    private String cnNm;
    private String cnDesc;
    private String cnUrl;
    private String userId; // The user creating the clan
}
