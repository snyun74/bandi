package com.bandi.backend.entity.band;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BnRoomAttachmentId implements Serializable {
    private Long roomNo;
    private Long attachNo;
}
