package com.bandi.backend.entity.sns;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class InteractionId implements Serializable {
    private String targetType;
    private Long targetNo;
    private String userId;
}
