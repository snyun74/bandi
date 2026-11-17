package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdBannerDto {
    private Long adBannerNo;          // 배너 고유번호
    private String adBannerCd;        // 배너 위치코드
    private String adBannerNm;        // 배너명
    private Long attachNo;
    private String fileUrl;           // 미디어 미리보기를 위한 URL (CmAttachment 참조)
    private String mimeType;          // 이미지/영상 구분용
    private String adBannerLinkUrl;   // 배너 클릭 시 이동할 URL
    private String linkTargetFg;      // 링크이동구분 (I:내부화면, O:외부링크)
    private Integer sortSeq;          // 노출 정렬순서
    private String sttDate;           // 노출시작일자 (YYYYMMDD)
    private String endDate;           // 노출종료일자 (YYYYMMDD)
    private String useYn;             // 사용여부
    private String bannerStatCd;      // 배너상태코드 (BD004)
    private String insDtime;
    private String insId;
    private String updDtime;
    private String updId;
}
