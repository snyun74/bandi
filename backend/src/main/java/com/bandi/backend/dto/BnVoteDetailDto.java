package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BnVoteDetailDto {
    private Long bnVoteNo;
    private String title;
    private String description;
    private String endTime; // yyyyMMddHHmmss
    private Boolean allowMultiple;
    private Boolean isAnonymous;
    private List<QuestionDto> questions;
    private String insId; // Creator ID
    @Builder.Default
    private Boolean hasVoted = false;
    private List<Long> myVoteItemIds;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class QuestionDto {
        private Long bnVoteQuestionNo;
        private String questionText;
        private String questionType; // MULT, SING
        private List<ItemDto> items;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ItemDto {
        private Long bnVoteItemNo;
        private String itemText;
        private Integer itemOrder;
    }
}
