package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteListDto {
    private Long cnVoteNo;
    private String title;
    private String voteStatCd; // 'A' for Active, 'C' for Closed/Completed
    private String endTime;
    @com.fasterxml.jackson.annotation.JsonProperty("hasVoted")
    private boolean hasVoted;
    @com.fasterxml.jackson.annotation.JsonProperty("isExpired")
    private boolean isExpired;
    private int participantCount;
}
