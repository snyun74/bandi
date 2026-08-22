package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanScheduleBatchDto {
    private Long bnNo;
    private String userId;
    private List<PlanSlotDto> slots; // 선택된 시간 슬롯 목록

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanSlotDto {
        private String date; // YYYYMMDD
        private String time; // HH00 (예: 0800, 1600)
    }
}
