package com.bandi.backend.entity.band;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BnVoteResultId implements Serializable {
    private Long bnVoteNo;
    private Long bnVoteQuestionNo;
    private Long bnVoteItemNo;
    private String bnVoteResultUserId;
}
