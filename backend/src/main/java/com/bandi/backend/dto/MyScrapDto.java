package com.bandi.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyScrapDto {
    private Long scrapNo;
    private String scrapTableNm;
    private Long scrapTablePkNo;

    // For CM_BOARD: param1 is boardTypeFg
    // For CN_NOTICE: param1 is cnNo (clan ID)
    // For CN_BOARD: param1 is cnNo (clan ID), param2 is cnBoardTypeNo
    private String param1;
    private String param2;

    private String title;
    private String writerName;
    private Long likeCnt;
    private Long replyCnt;
    private String scrapDate; // Scrapped date string
    private String originalRegDate; // Original post date string
}
