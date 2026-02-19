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
public class BnVoteStatusDto {
    private Long bnVoteNo;
    private String title;
    private int totalVotes;
    private List<VoteOptionStatusDto> options;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VoteOptionStatusDto {
        private Long bnVoteItemNo;
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
        private String userName;
    }
}
