package com.bandi.backend.dto;

public interface BoardPostDto {
    Long getCnBoardNo();

    String getTitle();

    String getRegDate();

    String getUserNickNm();

    Long getBoardLikeCnt();

    Long getBoardReplyCnt();
}
