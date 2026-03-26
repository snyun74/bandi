package com.bandi.backend.controller;

import com.bandi.backend.dto.BandCreateRequestDto;
import com.bandi.backend.service.BandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.bandi.backend.dto.BandDetailDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bands")
@RequiredArgsConstructor
public class BandController {

    private final BandService bandService;

    private final com.bandi.backend.repository.CmAttachmentRepository cmAttachmentRepository;

    @GetMapping
    public ResponseEntity<java.util.List<com.bandi.backend.dto.ClanJamListDto>> getBandList(
            @RequestParam String userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String filterPart) {
        java.util.List<com.bandi.backend.dto.ClanJamListDto> list = bandService.getClanBandList(null, userId, keyword,
                sort, filterPart);
        return ResponseEntity.ok(list);
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<Long> createBand(
            @org.springframework.web.bind.annotation.RequestPart("data") BandCreateRequestDto dto,
            @org.springframework.web.bind.annotation.RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        if (dto.getUserId() == null || dto.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().build(); // Basic validation
        }

        // Handle File Upload
        if (file != null && !file.isEmpty()) {
            try {
                String currentDateTime = java.time.LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                String uploadDir = com.bandi.backend.utils.FileStorageUtil.getUploadDir();
                java.io.File dir = new java.io.File(uploadDir);
                if (!dir.exists())
                    dir.mkdirs();

                String originalFileName = file.getOriginalFilename();
                String extension = (originalFileName != null && originalFileName.contains("."))
                        ? originalFileName.substring(originalFileName.lastIndexOf("."))
                        : "";
                String savedFileName = java.util.UUID.randomUUID().toString() + extension;
                java.io.File dest = new java.io.File(dir, savedFileName);
                file.transferTo(dest);

                com.bandi.backend.entity.common.CmAttachment attachment = new com.bandi.backend.entity.common.CmAttachment();
                attachment.setFileName(originalFileName);
                attachment.setFilePath("/api/common_images/" + savedFileName);
                attachment.setFileSize(file.getSize());
                attachment.setMimeType(file.getContentType());
                attachment.setInsDtime(currentDateTime);
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                com.bandi.backend.entity.common.CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                dto.setAttachNo(savedAttachment.getAttachNo());

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.badRequest().build(); // Or handle error
            }
        }

        Long bnNo = bandService.createBand(dto);
        return ResponseEntity.ok(bnNo);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinBand(@RequestBody com.bandi.backend.dto.BandJoinDto dto) {
        try {
            bandService.joinBand(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("참가 실패: " + e.getMessage());
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelBand(@RequestBody com.bandi.backend.dto.BandJoinDto dto) {
        try {
            bandService.cancelBand(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("취소 실패: " + e.getMessage());
        }
    }

    @PostMapping("/kick")
    public ResponseEntity<?> kickBandMember(@RequestBody java.util.Map<String, Object> params) {
        try {
            bandService.kickBandMember(params);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("강퇴 실패: " + e.getMessage());
        }
    }

    @GetMapping("/{bnNo}")
    public ResponseEntity<?> getBandDetail(@PathVariable Long bnNo, @RequestParam String userId) {
        try {
            BandDetailDto detail = bandService.getBandDetail(bnNo, userId);
            return ResponseEntity.ok(detail);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{bnNo}")
    public ResponseEntity<?> deleteBand(@PathVariable Long bnNo, @RequestParam String userId) {
        try {
            bandService.deleteBand(bnNo, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.PutMapping(value = "/{bnNo}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateBand(
            @PathVariable Long bnNo,
            @org.springframework.web.bind.annotation.RequestPart("data") com.bandi.backend.dto.BandUpdateDto dto,
            @org.springframework.web.bind.annotation.RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

        if (dto.getUserId() == null || dto.getUserId().isEmpty()) {
            return ResponseEntity.badRequest().body("사용자 ID가 필요합니다.");
        }

        // Handle File Upload
        if (file != null && !file.isEmpty()) {
            try {
                String currentDateTime = java.time.LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                String uploadDir = com.bandi.backend.utils.FileStorageUtil.getUploadDir();
                java.io.File dir = new java.io.File(uploadDir);
                if (!dir.exists())
                    dir.mkdirs();

                String originalFileName = file.getOriginalFilename();
                String extension = (originalFileName != null && originalFileName.contains("."))
                        ? originalFileName.substring(originalFileName.lastIndexOf("."))
                        : "";
                String savedFileName = java.util.UUID.randomUUID().toString() + extension;
                java.io.File dest = new java.io.File(dir, savedFileName);
                file.transferTo(dest);

                com.bandi.backend.entity.common.CmAttachment attachment = new com.bandi.backend.entity.common.CmAttachment();
                attachment.setFileName(originalFileName);
                attachment.setFilePath("/api/common_images/" + savedFileName);
                attachment.setFileSize(file.getSize());
                attachment.setMimeType(file.getContentType());
                attachment.setInsDtime(currentDateTime);
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                com.bandi.backend.entity.common.CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                dto.setAttachNo(savedAttachment.getAttachNo());

            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.badRequest().body("파일 업로드 실패: " + e.getMessage());
            }
        }

        try {
            bandService.updateBand(bnNo, dto);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{bnNo}/status")
    public ResponseEntity<?> updateBandStatus(@PathVariable Long bnNo,
            @RequestBody java.util.Map<String, String> body) {
        try {
            String userId = body.get("userId");
            String status = body.get("status");
            bandService.updateBandStatus(bnNo, userId, status);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{bnNo}/verify-password")
    public ResponseEntity<?> verifyPassword(@PathVariable Long bnNo, @RequestBody java.util.Map<String, String> body) {
        String password = body.get("password");
        boolean isValid = bandService.verifyBandPassword(bnNo, password);
        if (isValid) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.badRequest().body("비밀번호가 일치하지 않습니다.");
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyJams(
            @RequestParam String userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        try {
            org.springframework.data.domain.Pageable pr = org.springframework.data.domain.PageRequest.of(page, size);
            return ResponseEntity.ok(bandService.getMyJams(userId, keyword, pr));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("나의 합주 목록 조회 실패: " + e.getMessage());
        }
    }

    @PostMapping("/schedule")
    public ResponseEntity<Void> createSchedule(@RequestBody com.bandi.backend.dto.BandScheduleDto bandScheduleDto) {
        bandService.createSchedule(bandScheduleDto);
        return ResponseEntity.ok().build();
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/schedule")
    public ResponseEntity<Void> deleteSchedule(@RequestParam Long bnNo, @RequestParam String userId,
            @RequestParam String date) {
        bandService.deleteSchedule(bnNo, userId, date);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{bnNo}/schedules")
    public ResponseEntity<?> getSchedules(@PathVariable Long bnNo) {
        try {
            return ResponseEntity.ok(bandService.getSchedules(bnNo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("일정 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/evaluation/pending")
    public ResponseEntity<?> getPendingEvaluation(@RequestParam String userId) {
        com.bandi.backend.dto.PendingEvaluationDto dto = bandService.getPendingEvaluation(userId);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @PostMapping("/evaluation")
    public ResponseEntity<?> submitEvaluation(@RequestBody com.bandi.backend.dto.EvaluationSubmissionDto dto) {
        try {
            bandService.submitEvaluation(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("평가 제출 실패: " + e.getMessage());
        }
    }

    @PostMapping("/evaluation/test/{userId}")
    public ResponseEntity<?> createTestEvaluation(@PathVariable String userId) {
        try {
            bandService.createTestEvaluation(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Test failed: " + e.getMessage());
        }
    }

    // =========================================================
    // 예약 API
    // =========================================================

    @PostMapping("/reserve")
    public ResponseEntity<?> reserveSession(@RequestBody java.util.Map<String, String> body) {
        try {
            Long bnNo = Long.valueOf(body.get("bnNo"));
            String sessionTypeCd = body.get("sessionTypeCd");
            String userId = body.get("userId");
            bandService.reserveSession(bnNo, sessionTypeCd, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{bnNo}/reservations")
    public ResponseEntity<?> getReservations(
            @PathVariable Long bnNo,
            @RequestParam(required = false) String sessionTypeCd) {
        try {
            return ResponseEntity.ok(bandService.getReservations(bnNo, sessionTypeCd));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/reserve/{rsvNo}")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long rsvNo,
            @RequestParam String userId) {
        try {
            bandService.cancelReservation(rsvNo, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
