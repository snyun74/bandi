package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class GatheringMatchResultDto {
    private Long roomNo;
    private Long gatherNo;
    private String roomNm;
    private Integer skillScoreTot;
    private Integer memberCnt;
    private BigDecimal skillScoreAvg;
    private List<String> requiredSessionNmList;
    private List<String> requiredSessionCdList;
    private List<GatheringMatchMemberDto> members;
}
