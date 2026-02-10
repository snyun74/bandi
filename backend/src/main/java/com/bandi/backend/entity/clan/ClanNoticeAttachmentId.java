package com.bandi.backend.entity.clan;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@lombok.Data
public class ClanNoticeAttachmentId implements Serializable {
    private Long cnNoticeNo;
    private Long attachNo;
}
