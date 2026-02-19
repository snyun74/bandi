package com.bandi.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class EvaluationSubmissionDto {
    private Long bnNo;
    private String userId; // The evaluator (current user)
    private List<EvaluationResultDto> results;

    @Data
    @NoArgsConstructor
    public static class EvaluationResultDto {
        private String targetUserId;
        private Integer score;
        private boolean moodMaker;
    }
}
