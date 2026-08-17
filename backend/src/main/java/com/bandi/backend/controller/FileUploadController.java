package com.bandi.backend.controller;

import com.bandi.backend.dto.UploadFileResultDto;
import com.bandi.backend.enums.FileCategory;
import com.bandi.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /**
     * 표준 단일 파일 업로드 API
     * POST /api/v1/files/upload?category=shorts&userId=user123
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "board") String categoryStr,
            @RequestParam(value = "userId", required = false) String userId) {

        log.info("파일 업로드 요청: category={}, userId={}, filename={}", categoryStr, userId, file.getOriginalFilename());
        
        FileCategory category = FileCategory.fromString(categoryStr);
        UploadFileResultDto result = fileStorageService.storeFile(file, category, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);
        response.put("message", "파일이 성공적으로 업로드되었습니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 표준 다중 파일 업로드 API
     * POST /api/v1/files/upload/multiple?category=board&userId=user123
     */
    @PostMapping("/upload/multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "category", defaultValue = "board") String categoryStr,
            @RequestParam(value = "userId", required = false) String userId) {

        log.info("다중 파일 업로드 요청: category={}, fileCount={}", categoryStr, files != null ? files.size() : 0);

        FileCategory category = FileCategory.fromString(categoryStr);
        List<UploadFileResultDto> resultList = fileStorageService.storeFiles(files, category, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", resultList);
        response.put("message", resultList.size() + "개의 파일이 성공적으로 업로드되었습니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 표준 파일 삭제 API
     * DELETE /api/v1/files?path=/shorts/202608/shorts_xxx.mp4
     */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteFile(
            @RequestParam("path") String relativePathOrUrl) {

        boolean deleted = fileStorageService.deleteFile(relativePathOrUrl);

        Map<String, Object> response = new HashMap<>();
        response.put("success", deleted);
        response.put("message", deleted ? "파일이 성공적으로 삭제되었습니다." : "파일 삭제에 실패했거나 대상 파일이 존재하지 않습니다.");

        return ResponseEntity.ok(response);
    }
}
