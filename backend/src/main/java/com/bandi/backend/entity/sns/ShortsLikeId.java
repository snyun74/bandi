package com.bandi.backend.entity.sns;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShortsLikeId implements Serializable {
    private Long shortsNo;
    private String userId;
}
