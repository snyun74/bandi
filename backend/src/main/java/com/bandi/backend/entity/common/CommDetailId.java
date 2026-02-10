package com.bandi.backend.entity.common;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@EqualsAndHashCode
public class CommDetailId implements Serializable {
    private String commCd;
    private String commDtlCd;
}
