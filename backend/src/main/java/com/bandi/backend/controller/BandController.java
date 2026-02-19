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
                String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
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
                attachment.setFilePath("/common_images/" + savedFileName);
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
            return ResponseEntity.badRequest().body("Join failed: " + e.getMessage());
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelBand(@RequestBody com.bandi.backend.dto.BandJoinDto dto) {
        try {
            bandService.cancelBand(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cancel failed: " + e.getMessage());
        }
    }

    @PostMapping("/kick")
    public ResponseEntity<?> kickBandMember(@RequestBody java.util.Map<String, Object> params) {
        try {
            bandService.kickBandMember(params);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Kick failed: " + e.getMessage());
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
            return ResponseEntity.badRequest().body("UserId is required");
        }

        // Handle File Upload
        if (file != null && !file.isEmpty()) {
            try {
                String currentDateTime = java.time.LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
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
                attachment.setFilePath("/common_images/" + savedFileName);
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
                return ResponseEntity.badRequest().body("File upload failed: " + e.getMessage());
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
            return ResponseEntity.badRequest().body("Incorrect password");
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyJams(@RequestParam String userId) {
        try {
            return ResponseEntity.ok(bandService.getMyJams(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch my jams: " + e.getMessage());
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
            return ResponseEntity.badRequest().body("Failed to fetch schedules: " + e.getMessage());
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
            return ResponseEntity.badRequest().body("Evaluation failed: " + e.getMessage());
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
}
