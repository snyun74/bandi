package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminClanApprovalDto {
    private Long cnNo;
    private String cnNm;
    private String cnDesc;
    private String cnUrl;
    private Long attachNo;
    private String fileUrl;
    private String cnApprStatCd; // RQ:요청, RJ:거절, CN:확정
    private String insDtime;
}
