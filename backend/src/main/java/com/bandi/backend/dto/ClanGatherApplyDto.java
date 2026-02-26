package com.bandi.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClanGatherApplyDto {
    private Long gatherNo;
    private String userId;
    private String sessionTypeCd1st;
    private String sessionTypeCd2nd;
}
