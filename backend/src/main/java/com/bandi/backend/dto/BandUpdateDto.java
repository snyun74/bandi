package com.bandi.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BandUpdateDto {
    private String userId;
    private String description;
    private Long attachNo;
}
