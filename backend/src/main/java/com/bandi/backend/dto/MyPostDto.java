package com.bandi.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyPostDto {
    private String postType; // "CM_BOARD" | "CN_NOTICE" | "CN_BOARD"
    private Long pkNo; // PK (boardNo, cnNoticeNo, cnBoardNo)
    private String param1; // CM_BOARD: boardTypeFg / CN_NOTICE: cnNo / CN_BOARD: cnNo
    private String param2; // CN_BOARD: cnBoardTypeNo (otherwise null)
    private String title;
    private Long likeCnt;
    private Long replyCnt;
    private String regDate; // 원본 작성일 (yyyyMMdd or yyyyMMddHHmmss)
}
