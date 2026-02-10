package com.bandi.backend.entity.clan;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ClanBoardAttachmentId implements Serializable {
    private Long cnBoardNo;
    private Long attachNo;
}
