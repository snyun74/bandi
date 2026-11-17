package com.bandi.backend.controller;

import com.bandi.backend.dto.AdBannerDto;
import com.bandi.backend.dto.AdBannerSaveRequestDto;
import com.bandi.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * 배너/광고 관리 API
 * - 관리자 전용: 목록, 등록, 수정, 사용여부(오픈/중지) 변경
 * - 사용자 화면용: 위치코드별 노출 배너 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    /** 관리자 배너 목록 */
    @GetMapping
    public ResponseEntity<?> getBanners(@RequestParam(value = "userId", required = false) String userId) {
        return handle(() -> ResponseEntity.ok(adminService.getBanners(userId)));
    }

    /** 위치코드별 현재 노출 배너 목록 (사용자 화면용) */
    @GetMapping("/display/{adBannerCd}")
    public ResponseEntity<List<AdBannerDto>> getDisplayBanners(@PathVariable String adBannerCd) {
        return ResponseEntity.ok(adminService.getDisplayBanners(adBannerCd));
    }

    /** 위치코드의 첫 번째 노출 배너 (기존 메인 화면 호환용: /api/admin/banners/MAIN) */
    @GetMapping("/{adBannerCd:[A-Za-z][A-Za-z0-9_]*}")
    public ResponseEntity<AdBannerDto> getBanner(@PathVariable String adBannerCd) {
        AdBannerDto banner = adminService.getBannerByCd(adBannerCd);
        if (banner != null) {
            return ResponseEntity.ok(banner);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * 배너 등록
     * - multipart 파트 수 제한(server.tomcat.max-part-count 기본 10)을 넘지 않도록
     *   배너 정보는 JSON 파트(data) 1개, 미디어는 file 파트 1개로 전송받는다.
     */
    @PostMapping
    public ResponseEntity<?> createBanner(
            @RequestPart("data") AdBannerSaveRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return handle(() -> ResponseEntity.ok(adminService.createBanner(request, file)));
    }

    /** 배너 수정 (파일 미전송 시 기존 미디어 유지) */
    @PutMapping("/{adBannerNo:\\d+}")
    public ResponseEntity<?> updateBanner(
            @PathVariable Long adBannerNo,
            @RequestPart("data") AdBannerSaveRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return handle(() -> ResponseEntity.ok(adminService.updateBanner(adBannerNo, request, file)));
    }

    /** 배너 사용여부(오픈/중지) 변경 */
    @PatchMapping("/{adBannerNo:\\d+}/use")
    public ResponseEntity<?> updateBannerUseYn(
            @PathVariable Long adBannerNo,
            @RequestParam("useYn") String useYn,
            @RequestParam(value = "userId", required = false) String userId) {
        return handle(() -> {
            adminService.updateBannerUseYn(adBannerNo, useYn, userId);
            return ResponseEntity.ok(Map.of("message", "변경되었습니다."));
        });
    }

    /** 공통 예외 처리: 입력 오류 400, 권한 오류 403, 그 외 500 (내부 오류 내용은 응답에 노출하지 않음) */
    private ResponseEntity<?> handle(Supplier<ResponseEntity<?>> action) {
        try {
            return action.get();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("배너 처리 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "배너 처리 중 오류가 발생했습니다."));
        }
    }
}
