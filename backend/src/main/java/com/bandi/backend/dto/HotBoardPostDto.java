package com.bandi.backend.dto;

public interface HotBoardPostDto {
    Long getCnNo();

    Long getCnBoardTypeNo();

    Long getCnBoardNo();

    String getTitle();

    String getRegDate(); // ins_dtime (formatted or raw)

    String getUserNickNm();

    Long getBoardLikeCnt();

    Long getBoardReplyCnt();
}
