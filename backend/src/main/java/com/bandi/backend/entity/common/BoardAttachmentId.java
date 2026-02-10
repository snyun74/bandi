package com.bandi.backend.entity.common;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BoardAttachmentId implements Serializable {
    private Long boardNo;
    private Long attachNo;
}
