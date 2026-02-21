package com.bandi.backend.service;

import com.bandi.backend.dto.AdBannerDto;
import com.bandi.backend.dto.AdminClanApprovalDto;
import com.bandi.backend.entity.cm.CmAdBanner;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.clan.ClanGroup;
import com.bandi.backend.repository.CmAdBannerRepository;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.repository.ClanGroupRepository;
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
                String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
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
                attachment.setFilePath("/common_images/" + savedFileName);
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

        clan.setCnApprStatCd(status);
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        clan.setUpdDtime(currentDateTime);
        clan.setUpdId(userId);

        clanGroupRepository.save(clan);
    }
}
