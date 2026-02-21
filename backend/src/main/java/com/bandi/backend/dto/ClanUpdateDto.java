package com.bandi.backend.dto;

import lombok.Data;

@Data
public class ClanUpdateDto {
    private String userId;
    private String cnNm;
    private String cnDesc;
    private String cnUrl;
}
