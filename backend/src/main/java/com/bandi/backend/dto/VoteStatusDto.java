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
public class VoteStatusDto {
    private Long cnVoteNo;
    private String title;
    private int totalVotes; // Total number of people who voted (or total votes cast if multiple allowed?
                            // usually people count)
    private List<VoteOptionStatusDto> options;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VoteOptionStatusDto {
        private Long cnVoteItemNo;
        private String itemText;
        private int count;
        private List<VoterDto> voters;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VoterDto {
        private String userId;
        private String userName; // Or nickname
    }
}
