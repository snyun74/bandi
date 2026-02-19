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
public class PendingEvaluationDto {
    private Long bnNo;
    private String title;
    private String songTitle;
    private String artist;
    private List<EvaluationTargetDto> targets;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationTargetDto {
        private String userId;
        private String userNick;
        private String part; // Optional, might be nice to show
    }
}
