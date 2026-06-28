package com.bandi.backend.service;

import com.bandi.backend.dto.AdBannerDto;
import com.bandi.backend.dto.AdminClanApprovalDto;
import com.bandi.backend.entity.cm.CmAdBanner;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.clan.ClanGroup;
import com.bandi.backend.repository.CmAdBannerRepository;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.repository.ClanGroupRepository;
import com.bandi.backend.repository.CmReportRepository;
import com.bandi.backend.repository.CmBlockRepository;
import com.bandi.backend.repository.BoardRepository;
import com.bandi.backend.repository.ClanBoardRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final CmAdBannerRepository cmAdBannerRepository;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final ClanGroupRepository clanGroupRepository;
    private final CmReportRepository cmReportRepository;
    private final CmBlockRepository cmBlockRepository;
    private final ChatService chatService;
    private final BoardRepository boardRepository;
    private final ClanBoardRepository clanBoardRepository;
    private final UserRepository userRepository;

    public List<AdBannerDto> getBanners() {
        return cmAdBannerRepository.findAllByOrderByInsDtimeDesc().stream()
                .map(banner -> {
                    String fileUrl = null;
                    String mimeType = null;
                    if (banner.getAttachNo() != null && banner.getAttachNo() != 0) {
                        CmAttachment attachment = cmAttachmentRepository.findById(banner.getAttachNo()).orElse(null);
                        if (attachment != null) {
                            fileUrl = attachment.getFilePath();
                            mimeType = attachment.getMimeType();
                        }
                    }
                    return AdBannerDto.builder()
                            .adBannerCd(banner.getAdBannerCd())
                            .adBannerNm(banner.getAdBannerNm())
                            .attachNo(banner.getAttachNo())
                            .fileUrl(fileUrl)
                            .mimeType(mimeType)
                            .adBannerLinkUrl(banner.getAdBannerLinkUrl())
                            .insDtime(banner.getInsDtime())
                            .updDtime(banner.getUpdDtime())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public AdBannerDto getBannerByCd(String adBannerCd) {
        return cmAdBannerRepository.findById(adBannerCd)
                .map(banner -> {
                    String fileUrl = null;
                    String mimeType = null;
                    if (banner.getAttachNo() != null && banner.getAttachNo() != 0) {
                        CmAttachment attachment = cmAttachmentRepository.findById(banner.getAttachNo()).orElse(null);
                        if (attachment != null) {
                            fileUrl = attachment.getFilePath();
                            mimeType = attachment.getMimeType();
                        }
                    }
                    return AdBannerDto.builder()
                            .adBannerCd(banner.getAdBannerCd())
                            .adBannerNm(banner.getAdBannerNm())
                            .attachNo(banner.getAttachNo())
                            .fileUrl(fileUrl)
                            .mimeType(mimeType)
                            .adBannerLinkUrl(banner.getAdBannerLinkUrl())
                            .insDtime(banner.getInsDtime())
                            .updDtime(banner.getUpdDtime())
                            .build();
                })
                .orElse(null);
    }

    @Transactional
    public void updateBannerAttachment(String adBannerCd, MultipartFile file, String userId, String linkUrl) {
        CmAdBanner banner = cmAdBannerRepository.findById(adBannerCd)
                .orElseThrow(() -> new RuntimeException("Banner not found: " + adBannerCd));

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        try {
            if (file != null && !file.isEmpty()) {
                String uploadDir = com.bandi.backend.utils.FileStorageUtil.getUploadDir();
                File dir = new File(uploadDir);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String originalFileName = file.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String savedFileName = UUID.randomUUID().toString() + extension;
                File dest = new File(dir, savedFileName);
                file.transferTo(dest);

                CmAttachment attachment = new CmAttachment();
                attachment.setFileName(originalFileName);
                attachment.setFilePath("/api/common_images/" + savedFileName);
                attachment.setFileSize(file.getSize());
                attachment.setMimeType(file.getContentType());
                attachment.setInsDtime(currentDateTime);
                attachment.setInsId(userId);
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(userId);

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                banner.setAttachNo(savedAttachment.getAttachNo());
            }

            // Update Banner details
            if (linkUrl != null) {
                // Front에서 빈칸으로 보내면 삭제, 값이 있으면 저장
                banner.setAdBannerLinkUrl(linkUrl.trim().isEmpty() ? null : linkUrl.trim());
            }
            banner.setUpdDtime(currentDateTime);
            banner.setUpdId(userId);
            cmAdBannerRepository.save(banner);

        } catch (IOException e) {
            log.error("Failed to upload banner file", e);
            throw new RuntimeException("Banner file upload failed", e);
        }
    }

    // --- Clan Approval Management ---

    @Transactional(readOnly = true)
    public List<AdminClanApprovalDto> getAdminClans() {
        return clanGroupRepository.findAllAdminClans();
    }

    @Transactional
    public void updateClanApprStatCd(Long cnNo, String status, String userId) {
        ClanGroup clan = clanGroupRepository.findById(cnNo)
                .orElseThrow(() -> new RuntimeException("Clan not found: " + cnNo));

        String oldStatus = clan.getCnApprStatCd();
        clan.setCnApprStatCd(status);
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        clan.setUpdDtime(currentDateTime);
        clan.setUpdId(userId);

        clanGroupRepository.save(clan);

        // 클랜 승인(확정) 시 자동 메시지 및 푸시 발송 (RQ/RJ -> CN 상태 변경 시에만)
        if ("CN".equals(status) && !"CN".equals(oldStatus)) {
            com.bandi.backend.dto.ChatMessageCreateDto chatDto = new com.bandi.backend.dto.ChatMessageCreateDto();
            chatDto.setCnNo(cnNo);
            chatDto.setSndUserId("snyun");
            chatDto.setMsg("클랜이 개설됐어요! 대화를 시작해보세요!");
            chatDto.setMsgTypeCd("TEXT");
            chatDto.setRoomType("CLAN");
            chatService.saveMessage(chatDto);
        }
    }

    public long getPendingClanCount() {
        return clanGroupRepository.countPendingClans();
    }

    public long getUnprocessedReportCount() {
        return cmReportRepository.countByProcStatFg("N");
    }

    public org.springframework.data.domain.Page<com.bandi.backend.repository.CmReportProjection> getReports(String search, org.springframework.data.domain.Pageable pageable) {
        return cmReportRepository.findAllReportsWithNicknames(search, pageable);
    }

    public org.springframework.data.domain.Page<com.bandi.backend.repository.CmBlockProjection> getBlocks(String search, org.springframework.data.domain.Pageable pageable) {
        return cmBlockRepository.findAllBlocksWithNicknames(search, pageable);
    }

    @Transactional
    public void updateReportStatus(Long reportNo, String status, String userId) {
        com.bandi.backend.entity.common.CmReport report = cmReportRepository.findById(reportNo)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportNo));

        report.setProcStatFg(status);
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        report.setReportProcDtime(currentDateTime); 
        report.setUpdDtime(currentDateTime);
        report.setUpdId(userId);

        cmReportRepository.save(report);

        // 만약 상태가 'Y' (승인/처리완료)이면 실제 콘텐츠 삭제 및 사용자 추방(정지)을 진행합니다.
        if ("Y".equals(status)) {
            // 1. 사용자 정지 처리
            String targetUserId = report.getTargetUserId();
            if (targetUserId != null && !targetUserId.isEmpty()) {
                userRepository.findById(targetUserId).ifPresent(u -> {
                    u.setUserStatCd("B"); // 'B': Blocked (정지/차단)
                    u.setUpdDtime(currentDateTime);
                    u.setUpdId(userId);
                    userRepository.save(u);
                    log.info("Admin Service - Banned User: {}", targetUserId);
                });
            }

            // 2. 게시글(콘텐츠) 논리 삭제 처리
            String boardUrl = report.getBoardUrl();
            if (boardUrl != null && !boardUrl.isEmpty()) {
                try {
                    // boardUrl 예:
                    // 1) 일반 게시판: /main/board/detail?boardNo=123 또는 /main/board/detail/123
                    // 2) 클랜 게시판: /main/clan/board/detail/2/3/182 또는 쿼리/패스구조
                    if (boardUrl.contains("clan")) {
                        // 클랜 게시판 게시글 처리
                        Long boardNoVal = extractBoardNo(boardUrl, "boardNo");
                        if (boardNoVal == null) {
                            boardNoVal = extractBoardNoFromPath(boardUrl);
                        }
                        if (boardNoVal != null) {
                            final Long finalBoardNo = boardNoVal;
                            clanBoardRepository.findById(finalBoardNo).ifPresent(cb -> {
                                cb.setBoardStatCd("D"); // 'D': Deleted
                                cb.setUpdDtime(currentDateTime);
                                cb.setUpdId(userId);
                                clanBoardRepository.save(cb);
                                log.info("Admin Service - Deleted Clan Board Post: {}", finalBoardNo);
                            });
                        }
                    } else {
                        // 일반 자유 게시판 게시글 처리
                        Long boardNoVal = extractBoardNo(boardUrl, "boardNo");
                        if (boardNoVal == null) {
                            boardNoVal = extractBoardNoFromPath(boardUrl);
                        }
                        if (boardNoVal != null) {
                            final Long finalBoardNo = boardNoVal;
                            boardRepository.findById(finalBoardNo).ifPresent(b -> {
                                b.setBoardStatCd("D"); // 'D': Deleted
                                b.setUpdDtime(currentDateTime);
                                b.setUpdId(userId);
                                boardRepository.save(b);
                                log.info("Admin Service - Deleted Free Board Post: {}", finalBoardNo);
                            });
                        }
                    }
                } catch (Exception e) {
                    log.error("Admin Service - Failed to parse boardUrl or delete content: " + boardUrl, e);
                }
            }
        }
    }

    private Long extractBoardNo(String url, String paramName) {
        try {
            if (url.contains("?")) {
                String queryString = url.substring(url.indexOf("?") + 1);
                String[] params = queryString.split("&");
                for (String param : params) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && pair[0].equals(paramName)) {
                        return Long.parseLong(pair[1]);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract param " + paramName + " from url: " + url, e);
        }
        return null;
    }

    private Long extractBoardNoFromPath(String url) {
        try {
            String path = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
            String[] segments = path.split("/");
            for (int i = segments.length - 1; i >= 0; i--) {
                String segment = segments[i];
                if (!segment.isEmpty() && segment.matches("\\d+")) {
                    return Long.parseLong(segment);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract boardNo from path: " + url, e);
        }
        return null;
    }

    @Transactional
    public void deleteBlock(String userId, String blockUserId) {
        cmBlockRepository.deleteByUserIdAndBlockUserId(userId, blockUserId);
    }
}
