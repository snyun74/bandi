package com.bandi.backend.entity.clan;

import java.io.Serializable;
import java.util.Objects;
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
public class ClanVoteJoinId implements Serializable {
    private Long cnVoteNo;
    private String cnVoteUserId;
}
