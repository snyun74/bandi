package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Builder
public class ClanGatherResponseDto {
    private Long gatherNo;
    private Long cnNo;
    private String title;
    private String gatherDate;
    private Integer roomCnt;
    private String gatherStatCd;
    private String gatherProcFg;
    private String regDate;
    private List<ClanGatherWeightDto> weights;
    private boolean isApplied; // Whether the current user has applied
}
