package com.bandi.backend.service;

import com.bandi.backend.dto.UploadFileResultDto;
import com.bandi.backend.enums.FileCategory;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileStorageService {
    
    /**
     * 단일 파일 업로드 (자동 디렉토리 생성 및 상대 경로 표준화 적용)
     */
    UploadFileResultDto storeFile(MultipartFile file, FileCategory category, String userId);

    /**
     * 다중 파일 업로드
     */
    List<UploadFileResultDto> storeFiles(List<MultipartFile> files, FileCategory category, String userId);

    /**
     * 상대 경로 또는 파일 URL에 해당하는 파일 삭제
     */
    boolean deleteFile(String relativePathOrUrl);

    /**
     * 상대 경로를 프론트엔드용 풀 접근 URL로 변환
     */
    String getFullUrl(String relativePath);
}
