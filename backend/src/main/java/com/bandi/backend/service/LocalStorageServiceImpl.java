package com.bandi.backend.service;

import com.bandi.backend.dto.UploadFileResultDto;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.enums.FileCategory;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.utils.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocalStorageServiceImpl implements FileStorageService {

    private final CmAttachmentRepository cmAttachmentRepository;

    @Value("${file.base-url:http://localhost:8084}")
    private String baseUrl;

    @Override
    @Transactional
    public UploadFileResultDto storeFile(MultipartFile file, FileCategory category, String userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 존재하지 않습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "file_" + System.currentTimeMillis();
        }

        // 확장자 추출
        String ext = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex >= 0) {
            ext = originalFilename.substring(dotIndex);
        }

        // 1. 날짜 타임스탬프 계산
        LocalDateTime now = LocalDateTime.now();
        String yyyyMM = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String dtimeStr = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid8 = UUID.randomUUID().toString().substring(0, 8);

        // 2. 도메인 및 파일명 규격 정립
        String domain = category.getDomain();
        String savedFileName = String.format("%s_%s_%s%s", domain, dtimeStr, uuid8, ext);

        // 3. 표준 상대 경로: /{domain}/{YYYYMM}/{savedFileName}
        String relativePath = String.format("/%s/%s/%s", domain, yyyyMM, savedFileName);

        // 4. 물리적 저장 디렉토리 자동 생성 (없는 경우 생성)
        String baseUploadDir = FileStorageUtil.getBaseUploadDir();
        Path targetFolder = Paths.get(baseUploadDir, domain, yyyyMM);

        try {
            if (!Files.exists(targetFolder)) {
                Files.createDirectories(targetFolder);
                log.info("새로운 미디어 디렉토리 자동 생성 완료: {}", targetFolder.toAbsolutePath());
            }

            // 물리 파일 저장
            Path targetPath = targetFolder.resolve(savedFileName);
            file.transferTo(targetPath.toFile());
            log.info("파일 물리 저장 완료: {}", targetPath.toAbsolutePath());

        } catch (IOException e) {
            log.error("파일 물리 저장 실패: ", e);
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다: " + e.getMessage());
        }

        // 5. 공통 첨부파일 DB(CM_ATTACHMENT) 기록
        CmAttachment attachment = new CmAttachment();
        attachment.setFileName(originalFilename);
        attachment.setFilePath(relativePath); // DB에는 표준 상대 경로 저장
        attachment.setFileSize(file.getSize());
        attachment.setMimeType(file.getContentType());
        attachment.setInsDtime(dtimeStr);
        attachment.setInsId(userId != null ? userId : "SYSTEM");
        attachment.setUpdDtime(dtimeStr);
        attachment.setUpdId(userId != null ? userId : "SYSTEM");

        CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);

        // 6. fullUrl 구성 (예: http://localhost:8084/uploads/shorts/202608/shorts_...)
        String fullUrl = getFullUrl(relativePath);

        return UploadFileResultDto.builder()
                .attachNo(savedAttachment.getAttachNo())
                .category(domain)
                .originalName(originalFilename)
                .savedName(savedFileName)
                .relativePath(relativePath)
                .fullUrl(fullUrl)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();
    }

    @Override
    @Transactional
    public List<UploadFileResultDto> storeFiles(List<MultipartFile> files, FileCategory category, String userId) {
        List<UploadFileResultDto> resultList = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    resultList.add(storeFile(file, category, userId));
                }
            }
        }
        return resultList;
    }

    @Override
    @Transactional
    public boolean deleteFile(String relativePathOrUrl) {
        if (relativePathOrUrl == null || relativePathOrUrl.trim().isEmpty()) {
            return false;
        }

        String relativePath = relativePathOrUrl;

        // 전체 URL로 전달된 경우 상대 경로 부분만 추출
        if (relativePath.contains("/uploads/")) {
            relativePath = relativePath.substring(relativePath.indexOf("/uploads/") + 8);
        } else if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
            int thirdSlash = relativePath.indexOf("/", relativePath.indexOf("//") + 2);
            if (thirdSlash != -1) {
                relativePath = relativePath.substring(thirdSlash);
            }
        }

        if (!relativePath.startsWith("/")) {
            relativePath = "/" + relativePath;
        }

        // 물리 파일 삭제
        String baseUploadDir = FileStorageUtil.getBaseUploadDir();
        Path physicalPath = Paths.get(baseUploadDir + relativePath);

        try {
            boolean deleted = Files.deleteIfExists(physicalPath);
            log.info("파일 삭제 결과 [{}]: {}", physicalPath.toAbsolutePath(), deleted);
            return deleted;
        } catch (IOException e) {
            log.error("파일 삭제 에러: ", e);
            return false;
        }
    }

    @Override
    public String getFullUrl(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            return "";
        }
        if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
            return relativePath;
        }

        String cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String cleanPath = relativePath.startsWith("/") ? relativePath : "/" + relativePath;

        return cleanBaseUrl + "/uploads" + cleanPath;
    }
}
