package com.bandi.backend.entity.clan;

import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
public class ClanBoardDetailLikeId implements Serializable {

    private Long cnReplyNo;
    private String userId;
}
