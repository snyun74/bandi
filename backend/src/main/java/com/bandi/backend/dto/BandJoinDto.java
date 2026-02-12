package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BandJoinDto {
    private Long bnNo;
    private Long sessionNo;
    private String userId;
    private String sessionTypeCd;
}
