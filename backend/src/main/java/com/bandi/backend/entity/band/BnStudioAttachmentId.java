package com.bandi.backend.entity.band;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BnStudioAttachmentId implements Serializable {
    private Long studioNo;
    private Long attachNo;
}
