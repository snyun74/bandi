package com.bandi.backend.entity.clan;

import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
public class ClanBoardLikeId implements Serializable {

    private Long cnBoardNo;
    private String userId;
}
