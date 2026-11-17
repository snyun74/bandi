package com.bandi.backend.dto;

import lombok.Data;

/**
 * 관리자 배너 등록/수정 요청 (multipart/form-data 의 텍스트 필드)
 */
@Data
public class AdBannerSaveRequestDto {
    private String userId;            // 요청 관리자 ID
    private String adBannerCd;        // 배너 위치코드
    private String adBannerNm;        // 배너명
    private String adBannerLinkUrl;   // 링크 URL (선택)
    private String linkTargetFg;      // I:내부화면, O:외부링크
    private Integer sortSeq;          // 노출 정렬순서
    private String sttDate;           // 노출시작일자 (YYYYMMDD)
    private String endDate;           // 노출종료일자 (YYYYMMDD)
    private String useYn;             // 사용여부 (Y/N)
    private String bannerStatCd;      // 배너상태코드 (BD004)
}
