package com.bandi.backend.entity.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardDetailLikeId implements Serializable {
    private Long replyNo;
    private Long boardNo;
    private String userId;
}
