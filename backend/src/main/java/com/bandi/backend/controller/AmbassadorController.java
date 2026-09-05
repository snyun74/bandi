package com.bandi.backend.controller;

import com.bandi.backend.entity.band.BnAmbassador;
import com.bandi.backend.entity.band.BnEduCourse;
import com.bandi.backend.entity.band.BnEduLesson;
import com.bandi.backend.service.AmbassadorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ambassador")
@RequiredArgsConstructor
public class AmbassadorController {

    private final AmbassadorService ambassadorService;

    // --- 1. 엠버서더 신청 / 상태 조회 / 수정 ---

    @GetMapping("/status")
    public ResponseEntity<?> getAmbassadorStatus(@RequestParam String userId) {
        BnAmbassador ambassador = ambassadorService.getAmbassador(userId);
        if (ambassador == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(ambassador);
    }

    @PostMapping("/apply")
    public ResponseEntity<BnAmbassador> applyAmbassador(
            @RequestParam String userId,
            @RequestBody AmbassadorService.AmbassadorApplyDto dto) {
        return ResponseEntity.ok(ambassadorService.applyOrReapply(userId, dto));
    }

    @PutMapping("/info")
    public ResponseEntity<BnAmbassador> updateAmbassadorInfo(
            @RequestParam String userId,
            @RequestBody AmbassadorService.AmbassadorApplyDto dto) {
        return ResponseEntity.ok(ambassadorService.updateAmbassadorInfo(userId, dto));
    }

    // --- 2. 교육과정 관리 ---

    @GetMapping("/courses")
    public ResponseEntity<List<AmbassadorService.CourseResponseDto>> getCourses(@RequestParam String userId) {
        return ResponseEntity.ok(ambassadorService.getCoursesByAmbassador(userId));
    }

    @PostMapping("/courses")
    public ResponseEntity<BnEduCourse> createCourse(
            @RequestParam String userId,
            @RequestBody AmbassadorService.CourseRequestDto dto) {
        return ResponseEntity.ok(ambassadorService.createCourse(userId, dto));
    }

    @PutMapping("/courses/{courseNo}/status")
    public ResponseEntity<?> updateCourseStatus(
            @PathVariable Long courseNo,
            @RequestParam String userId,
            @RequestParam String status) {
        try {
            BnEduCourse updated = ambassadorService.updateCourseStatus(courseNo, userId, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- 3. 강의자료(차시) 관리 ---

    @GetMapping("/courses/{courseNo}/lessons")
    public ResponseEntity<List<AmbassadorService.LessonResponseDto>> getLessons(@PathVariable Long courseNo) {
        return ResponseEntity.ok(ambassadorService.getLessons(courseNo));
    }

    @PostMapping("/courses/{courseNo}/lessons")
    public ResponseEntity<BnEduLesson> createLesson(
            @PathVariable Long courseNo,
            @RequestParam String userId,
            @RequestBody AmbassadorService.LessonRequestDto dto) {
        return ResponseEntity.ok(ambassadorService.createLesson(courseNo, userId, dto));
    }

    @PutMapping("/lessons/{lessonNo}/status")
    public ResponseEntity<BnEduLesson> updateLessonStatus(
            @PathVariable Long lessonNo,
            @RequestParam String userId,
            @RequestParam String status) {
        return ResponseEntity.ok(ambassadorService.updateLessonStatus(lessonNo, userId, status));
    }

    @GetMapping("/lessons/{lessonNo}/download-data")
    public ResponseEntity<?> downloadLessonData(
            @PathVariable Long lessonNo,
            @RequestParam(required = false) String userId) {
        try {
            Map<String, Object> fileInfo = ambassadorService.getLessonDataFile(lessonNo, userId);
            Path filePath = (Path) fileInfo.get("filePath");
            String fileName = (String) fileInfo.get("fileName");
            String mimeType = (String) fileInfo.get("mimeType");

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
            ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
                    .filename(encodedFileName, StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .body(resource);
        } catch (RuntimeException e) {
            log.warn("교육자료 다운로드 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("교육자료 다운로드 중 예외 발생: ", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "파일 다운로드 중 오류가 발생했습니다."));
        }
    }

    // --- 4. 수강 평가 내역 조회 ---

    @GetMapping("/courses/{courseNo}/evaluations")
    public ResponseEntity<List<AmbassadorService.EvaluationResponseDto>> getEvaluations(@PathVariable Long courseNo) {
        return ResponseEntity.ok(ambassadorService.getEvaluations(courseNo));
    }

    // --- 5. 교육 신청 관리 ---

    @GetMapping("/applications")
    public ResponseEntity<List<AmbassadorService.ApplicationResponseDto>> getApplications(@RequestParam String userId) {
        return ResponseEntity.ok(ambassadorService.getApplicationsForAmbassador(userId));
    }

    @PutMapping("/applications/{appNo}/payment")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Long appNo,
            @RequestParam String status,
            @RequestParam String userId) {
        return ResponseEntity.ok(ambassadorService.updatePaymentStatus(appNo, status, userId));
    }

    @PutMapping("/applications/{appNo}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long appNo,
            @RequestParam String status,
            @RequestParam(required = false) String rejectBigo,
            @RequestParam String userId) {
        try {
            return ResponseEntity.ok(ambassadorService.updateApplicationStatus(appNo, status, rejectBigo, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // --- 6. 사용자용 공개 쇼케이스 및 교육과정 수강 신청 ---

    @GetMapping("/public/ambassadors")
    public ResponseEntity<List<AmbassadorService.PublicAmbassadorDto>> getPublicAmbassadors() {
        return ResponseEntity.ok(ambassadorService.getPublicAmbassadors());
    }

    @GetMapping("/public/courses/{courseNo}")
    public ResponseEntity<?> getPublicCourseDetail(@PathVariable Long courseNo) {
        try {
            return ResponseEntity.ok(ambassadorService.getPublicCourseDetail(courseNo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/public/courses/{courseNo}/apply")
    public ResponseEntity<?> applyCourse(
            @PathVariable Long courseNo,
            @RequestParam String userId,
            @RequestBody(required = false) AmbassadorService.CourseApplyRequestDto dto) {
        try {
            return ResponseEntity.ok(ambassadorService.applyCourse(courseNo, userId, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/public/my-applications")
    public ResponseEntity<List<AmbassadorService.ApplicationResponseDto>> getMyApplications(@RequestParam String userId) {
        return ResponseEntity.ok(ambassadorService.getMyApplications(userId));
    }
}
