package com.bandi.backend.repository;

public interface CmReportProjection {
    Long getReportNo();
    String getReportUserId();
    String getReportUserNickNm();
    String getTargetUserId();
    String getTargetUserNickNm();
    String getBoardUrl();
    String getContent();
    String getReportDtime();
    String getProcStatFg();
}
