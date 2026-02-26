package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ClanGatherCreateDto {
    private Long cnNo;
    private String title;
    private String gatherDate;
    private Integer roomCnt;
    private String userId;
    private List<ClanGatherWeightDto> weights;
    private List<String> sessionTypeCds;
}
