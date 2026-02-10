package com.bandi.backend.controller;

import com.bandi.backend.dto.ClanNoticeCommentDto;
import com.bandi.backend.dto.ClanNoticeDto;
import com.bandi.backend.entity.clan.ClanNotice;
import com.bandi.backend.entity.clan.ClanNoticeDetail;
import com.bandi.backend.repository.ClanNoticeDetailRepository;
import com.bandi.backend.repository.ClanNoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clans")
@RequiredArgsConstructor
public class ClanNoticeController {

        private final ClanNoticeRepository clanNoticeRepository;
        private final ClanNoticeDetailRepository clanNoticeDetailRepository;
        private final com.bandi.backend.repository.CmAttachmentRepository cmAttachmentRepository;
        private final com.bandi.backend.repository.ClanNoticeAttachmentRepository clanNoticeAttachmentRepository;
        // Assuming ClanNoticeAttachmentRepository exists or needs to be created.
        // I saw ClanNoticeAttachment.java in file search.
        // I will check for ClanNoticeAttachmentRepository.java existence first?
        // User said "Board" uses CN_BOARD_ATTACHMENT. Notice should use
        // CN_NOTICE_ATTACHMENT?
        // I saw `entity\clan\ClanNoticeAttachment.java` in search results.
        // I will assume repository exists or I will create it.
        // Let's assume it doesn't exist yet and just use CmAttachment for now, or check
        // for it.
        // Actually I should verify repository existence.
        // But for now I will add CmAttachmentRepository.

        @GetMapping("/{clanId}/notices")
        public ResponseEntity<List<ClanNoticeDto>> getClanNotices(
                        @PathVariable Long clanId,
                        @RequestParam(required = false) Integer limit) {
                String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

                List<ClanNotice> notices = clanNoticeRepository.findValidNotices(clanId, currentDate);

                java.util.stream.Stream<ClanNotice> stream = notices.stream();
                if (limit != null && limit > 0) {
                        stream = stream.limit(limit);
                }

                List<ClanNoticeDto> dtos = stream
                                .map(notice -> ClanNoticeDto.builder()
                                                .cnNoticeNo(notice.getCnNoticeNo())
                                                .cnNo(notice.getCnNo())
                                                .commentCount(notice.getCommentCount())
                                                .title(notice.getTitle())
                                                .content(notice.getContent())
                                                .writerUserId(notice.getWriterUserId())
                                                .pinYn(notice.getPinYn())
                                                .stdDate(notice.getStdDate())
                                                .endDate(notice.getEndDate())
                                                .insDtime(notice.getInsDtime())
                                                .build())
                                .collect(Collectors.toList());

                return ResponseEntity.ok(dtos);
        }

        @PostMapping(value = "/{clanId}/notices", consumes = { "multipart/form-data" })
        public ResponseEntity<?> createClanNotice(
                        @PathVariable Long clanId,
                        @RequestPart("data") ClanNoticeDto dto,
                        @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {

                String currentDateTime = java.time.LocalDateTime.now()
                                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

                // 1. Save Attachment if exists
                Long attachNo = null;
                if (file != null && !file.isEmpty()) {
                        try {
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
                                attachment.setInsId(dto.getWriterUserId());
                                attachment.setUpdDtime(currentDateTime);
                                attachment.setUpdId(dto.getWriterUserId());

                                com.bandi.backend.entity.common.CmAttachment savedAttachment = cmAttachmentRepository
                                                .save(attachment);
                                attachNo = savedAttachment.getAttachNo();

                        } catch (Exception e) {
                                e.printStackTrace();
                                return ResponseEntity.badRequest().body("File upload failed: " + e.getMessage());
                        }
                }

                ClanNotice notice = new ClanNotice();
                notice.setCnNo(clanId);
                notice.setTitle(dto.getTitle());
                notice.setContent(dto.getContent());
                notice.setWriterUserId(dto.getWriterUserId());
                notice.setPinYn(dto.getPinYn());
                notice.setStdDate(dto.getStdDate());
                notice.setEndDate(dto.getEndDate());
                notice.setYoutubeUrl(dto.getYoutubeUrl());
                notice.setInsDtime(currentDateTime);
                notice.setInsId(dto.getWriterUserId());
                notice.setUpdDtime(currentDateTime);
                notice.setUpdId(dto.getWriterUserId());

                ClanNotice savedNotice = clanNoticeRepository.save(notice);

                // 3. Save ClanNoticeAttachment if attachment exists
                if (attachNo != null) {
                        com.bandi.backend.entity.clan.ClanNoticeAttachment noticeAttachment = new com.bandi.backend.entity.clan.ClanNoticeAttachment();
                        noticeAttachment.setCnNoticeNo(savedNotice.getCnNoticeNo());
                        noticeAttachment.setAttachNo(attachNo);
                        noticeAttachment.setAttachStatCd("A");
                        noticeAttachment.setInsDtime(currentDateTime);
                        noticeAttachment.setInsId(dto.getWriterUserId());
                        noticeAttachment.setUpdDtime(currentDateTime);
                        noticeAttachment.setUpdId(dto.getWriterUserId());

                        clanNoticeAttachmentRepository.save(noticeAttachment);
                }

                return ResponseEntity.ok(java.util.Map.of("message", "Notice created successfully"));
        }

        // Get Single Notice Detail
        @GetMapping("/{clanId}/notices/{noticeId}")
        public ResponseEntity<ClanNoticeDto> getClanNotice(@PathVariable Long clanId, @PathVariable Long noticeId) {
                return clanNoticeRepository.findById(noticeId)
                                .map(notice -> {
                                        String attachFilePath = null;
                                        java.util.List<com.bandi.backend.entity.clan.ClanNoticeAttachment> attachments = clanNoticeAttachmentRepository
                                                        .findByCnNoticeNo(notice.getCnNoticeNo());

                                        if (!attachments.isEmpty()) {
                                                // Assuming one active attachment or taking the first one
                                                // Filter by attachStatCd if needed, but for now take first
                                                Long attachNo = attachments.get(0).getAttachNo();
                                                com.bandi.backend.entity.common.CmAttachment cmAttachment = cmAttachmentRepository
                                                                .findById(attachNo).orElse(null);
                                                if (cmAttachment != null) {
                                                        attachFilePath = cmAttachment.getFilePath();
                                                }
                                        }

                                        return ClanNoticeDto.builder()
                                                        .cnNoticeNo(notice.getCnNoticeNo())
                                                        .cnNo(notice.getCnNo())
                                                        .title(notice.getTitle())
                                                        .content(notice.getContent())
                                                        .writerUserId(notice.getWriterUserId())
                                                        .pinYn(notice.getPinYn())
                                                        .stdDate(notice.getStdDate())
                                                        .endDate(notice.getEndDate())
                                                        .youtubeUrl(notice.getYoutubeUrl())
                                                        .attachFilePath(attachFilePath)
                                                        .insDtime(notice.getInsDtime())
                                                        .build();
                                })
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        // Get Comments
        @GetMapping("/{clanId}/notices/{noticeId}/comments")
        public ResponseEntity<List<ClanNoticeCommentDto>> getNoticeComments(@PathVariable Long clanId,
                        @PathVariable Long noticeId) {
                List<ClanNoticeDetail> comments = clanNoticeDetailRepository
                                .findByCnNoticeNoOrderByInsDtimeAsc(noticeId);
                List<ClanNoticeCommentDto> dtos = comments.stream()
                                .map(comment -> ClanNoticeCommentDto.builder()
                                                .cnCommentNo(comment.getCnCommentNo())
                                                .cnNoticeNo(comment.getCnNoticeNo())
                                                .commentUserId(comment.getCommentUserId())
                                                .userNickNm(comment.getUser() != null
                                                                ? comment.getUser().getUserNickNm()
                                                                : comment.getCommentUserId()) // Fallback to ID
                                                .parentCommentNo(comment.getParentCommentNo())
                                                .content(comment.getContent())
                                                .insDtime(comment.getInsDtime())
                                                .build())
                                .collect(Collectors.toList());
                return ResponseEntity.ok(dtos);
        }

        // Add Comment
        @PostMapping("/{clanId}/notices/{noticeId}/comments")
        public ResponseEntity<?> addComment(
                        @PathVariable Long clanId,
                        @PathVariable Long noticeId,
                        @RequestBody ClanNoticeCommentDto dto) {

                String currentDateTime = java.time.LocalDateTime.now()
                                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

                ClanNoticeDetail comment = new ClanNoticeDetail();
                comment.setCnNoticeNo(noticeId);
                comment.setCommentUserId(dto.getCommentUserId());
                comment.setContent(dto.getContent());
                comment.setParentCommentNo(dto.getParentCommentNo()); // 0 or null if root
                comment.setCommentStatCd("A"); // Active
                comment.setInsDtime(currentDateTime);
                comment.setInsId(dto.getCommentUserId());
                comment.setUpdDtime(currentDateTime);
                comment.setUpdId(dto.getCommentUserId());

                clanNoticeDetailRepository.save(comment);

                return ResponseEntity.ok(java.util.Map.of("message", "Comment added successfully"));
        }
}
