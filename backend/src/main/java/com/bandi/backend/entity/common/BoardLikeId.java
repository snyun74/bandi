package com.bandi.backend.entity.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardLikeId implements Serializable {
    private Long boardNo;
    private String userId;
}
