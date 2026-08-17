package com.bandi.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadFileResultDto {
    private Long attachNo;         // 공통 첨부파일 ID (DB 키값)
    private String category;       // 도메인 카테고리 (profile, board, shorts 등)
    private String originalName;   // 사용자가 올린 원본 파일명
    private String savedName;      // 서버에 저장된 생성 파일명
    private String relativePath;   // DB에 저장된 표준 상대 경로 (예: /shorts/202608/shorts_...)
    private String fullUrl;        // 클라이언트(앱/웹)에서 바로 접속 가능한 전체 HTTP(S) URL
    private Long fileSize;         // 바이트 단위 파일 용량
    private String mimeType;       // 파일 MIME 타입
}
