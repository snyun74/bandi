package com.bandi.backend.entity.clan;

import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ClanVoteResultId implements Serializable {
    private Long cnVoteNo;
    private Long cnVoteQuestionNo;
    private Long cnVoteItemNo;
    private String cnVoteResultUserId;
}
