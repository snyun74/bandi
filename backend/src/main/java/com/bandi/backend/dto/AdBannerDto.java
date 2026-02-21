package com.bandi.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdBannerDto {
    private String adBannerCd;
    private String adBannerNm;
    private Long attachNo;
    private String fileUrl; // 미디어 미리보기를 위한 URL (CmAttachment 참조)
    private String mimeType; // 모달이 이미지/영상인지 판단하기 위해 필요
    private String adBannerLinkUrl; // 배너 클릭 시 이동할 URL
    private String insDtime;
    private String updDtime;
}
