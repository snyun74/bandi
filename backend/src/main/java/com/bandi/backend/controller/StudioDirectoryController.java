package com.bandi.backend.controller;

import com.bandi.backend.entity.band.BnStudioDir;
import com.bandi.backend.service.StudioDirectoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/studios/directory")
@RequiredArgsConstructor
public class StudioDirectoryController {

    private final StudioDirectoryService studioDirectoryService;

    /**
     * 1. 자체 DB 기반 전국 합주실 검색 (사용자용: useYn = Y)
     * GET /api/studios/directory/search?keyword=홍대&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<Page<BnStudioDir>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<BnStudioDir> result = studioDirectoryService.searchDirectory(keyword, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 2. 관리자용 전국 합주실 전체 목록 조회 및 검색 (최신 갱신일자 순)
     * GET /api/studios/directory/admin/list?keyword=홍대&page=0&size=20
     */
    @GetMapping("/admin/list")
    public ResponseEntity<Page<BnStudioDir>> getAdminList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<BnStudioDir> result = studioDirectoryService.searchDirectoryForAdmin(keyword, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 3. 관리자용 사용여부(Y/N) 설정
     * PUT /api/studios/directory/{dirNo}/use-yn?useYn=N
     */
    @PutMapping("/{dirNo}/use-yn")
    public ResponseEntity<BnStudioDir> updateUseYn(
            @PathVariable Long dirNo,
            @RequestParam String useYn
    ) {
        BnStudioDir updated = studioDirectoryService.updateUseYn(dirNo, useYn);
        return ResponseEntity.ok(updated);
    }

    /**
     * 4. 중복 합주실 정리 (상호명 + 도로명 기준)
     * POST /api/studios/directory/clean-duplicates
     */
    @PostMapping("/clean-duplicates")
    public ResponseEntity<Map<String, Object>> cleanDuplicates() {
        int deletedCount = studioDirectoryService.cleanDuplicates();
        return ResponseEntity.ok(Map.of("deletedCount", deletedCount));
    }

    /**
     * 5. 특정 키워드로 카카오 검색 후 자체 DB 수집
     * POST /api/studios/directory/sync/keyword
     */
    @PostMapping("/sync/keyword")
    public ResponseEntity<Map<String, Object>> syncKeyword(@RequestBody SyncKeywordRequest req) {
        String keyword = req != null && req.getKeyword() != null ? req.getKeyword() : "합주실";
        Map<String, Object> result = studioDirectoryService.syncFromKakaoByKeyword(keyword);
        return ResponseEntity.ok(result);
    }

    /**
     * 6. 전국 주요 지역별 "합주실" 일괄 수집/갱신 실행 (네이버 플레이스 링크 자동 생성)
     * POST /api/studios/directory/sync/nationwide
     */
    @PostMapping("/sync/nationwide")
    public ResponseEntity<Map<String, Object>> syncNationwide() {
        Map<String, Object> result = studioDirectoryService.syncNationwideStudios();
        return ResponseEntity.ok(result);
    }

    /**
     * 7. DB의 모든 합주실 링크를 네이버 플레이스 링크로 일괄 갱신
     * POST /api/studios/directory/update-naver-links
     */
    @PostMapping("/update-naver-links")
    public ResponseEntity<Map<String, Object>> updateNaverLinks() {
        Map<String, Object> result = studioDirectoryService.updateAllLinksToNaver();
        return ResponseEntity.ok(result);
    }

    @Data
    public static class SyncKeywordRequest {
        private String keyword;
    }
}
