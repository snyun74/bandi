package com.bandi.backend.service;

import com.bandi.backend.dto.AdBannerDto;
import com.bandi.backend.dto.AdBannerSaveRequestDto;
import com.bandi.backend.dto.AdminClanApprovalDto;
import com.bandi.backend.dto.UploadFileResultDto;
import com.bandi.backend.entity.cm.CmAdBanner;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.clan.ClanGroup;
import com.bandi.backend.enums.FileCategory;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
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
    private final FileStorageService fileStorageService;

    // --- Banner Management ---

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("uuuuMMdd").withResolverStyle(ResolverStyle.STRICT);
    private static final DateTimeFormatter YMDHMS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final Pattern BANNER_CD_PATTERN = Pattern.compile("^[A-Z0-9_]{1,20}$");
    private static final Pattern STAT_CD_PATTERN = Pattern.compile("^[A-Za-z0-9_]{1,20}$");
    private static final Pattern EXTERNAL_URL_PATTERN = Pattern.compile("^https?://\\S+$", Pattern.CASE_INSENSITIVE);
    /** 노출 대상 배너상태코드 (BD004) */
    private static final String BANNER_STAT_DISPLAY = "A";

    /** 관리자 배너 목록 (위치코드 → 정렬순서 → 최신순) */
    @Transactional(readOnly = true)
    public List<AdBannerDto> getBanners(String userId) {
        assertAdmin(userId);
        return toBannerDtos(cmAdBannerRepository.findAllByOrderByAdBannerCdAscSortSeqAscAdBannerNoDesc());
    }

    /** 위치코드별 현재 노출 대상 배너 목록 (사용자 화면용) */
    @Transactional(readOnly = true)
    public List<AdBannerDto> getDisplayBanners(String adBannerCd) {
        String today = LocalDate.now(KST).format(YMD);
        String cd = adBannerCd == null ? "" : adBannerCd.trim().toUpperCase();
        return toBannerDtos(cmAdBannerRepository.findDisplayBanners(cd, BANNER_STAT_DISPLAY, today));
    }

    /** 위치코드의 첫 번째 노출 배너 (기존 메인 화면 단건 조회 호환용) */
    @Transactional(readOnly = true)
    public AdBannerDto getBannerByCd(String adBannerCd) {
        List<AdBannerDto> banners = getDisplayBanners(adBannerCd);
        return banners.isEmpty() ? null : banners.get(0);
    }

    /** 배너 신규 등록 (미디어 파일 필수) */
    @Transactional
    public AdBannerDto createBanner(AdBannerSaveRequestDto req, MultipartFile file) {
        assertAdmin(req.getUserId());
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("배너 이미지 또는 영상을 선택해 주세요.");
        }
        validateBannerMedia(file);

        CmAdBanner banner = new CmAdBanner();
        applyBannerRequest(banner, req);

        // 입력값 검증이 끝난 뒤 업로드 (검증 실패 시 불필요한 파일이 남지 않도록)
        UploadFileResultDto uploadResult = fileStorageService.storeFile(file, FileCategory.ADMIN, req.getUserId());
        banner.setAttachNo(uploadResult.getAttachNo());

        String now = LocalDateTime.now(KST).format(YMDHMS);
        banner.setInsDtime(now);
        banner.setInsId(req.getUserId());
        banner.setUpdDtime(now);
        banner.setUpdId(req.getUserId());

        return toBannerDto(cmAdBannerRepository.save(banner), null);
    }

    /** 배너 수정 (파일 미선택 시 기존 미디어 유지) */
    @Transactional
    public AdBannerDto updateBanner(Long adBannerNo, AdBannerSaveRequestDto req, MultipartFile file) {
        assertAdmin(req.getUserId());
        CmAdBanner banner = cmAdBannerRepository.findById(adBannerNo)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));

        boolean hasNewFile = file != null && !file.isEmpty();
        if (hasNewFile) {
            validateBannerMedia(file);
        }
        applyBannerRequest(banner, req);

        if (hasNewFile) {
            UploadFileResultDto uploadResult = fileStorageService.storeFile(file, FileCategory.ADMIN, req.getUserId());
            banner.setAttachNo(uploadResult.getAttachNo());
        }

        banner.setUpdDtime(LocalDateTime.now(KST).format(YMDHMS));
        banner.setUpdId(req.getUserId());
        return toBannerDto(cmAdBannerRepository.save(banner), null);
    }

    /** 배너 사용여부(오픈/중지) 변경 */
    @Transactional
    public void updateBannerUseYn(Long adBannerNo, String useYn, String userId) {
        assertAdmin(userId);
        if (!"Y".equals(useYn) && !"N".equals(useYn)) {
            throw new IllegalArgumentException("사용여부 값이 올바르지 않습니다.");
        }
        CmAdBanner banner = cmAdBannerRepository.findById(adBannerNo)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));
        banner.setUseYn(useYn);
        banner.setUpdDtime(LocalDateTime.now(KST).format(YMDHMS));
        banner.setUpdId(userId);
        cmAdBannerRepository.save(banner);
    }

    /** 관리자(ADMIN_YN = 'Y') 여부 확인 */
    private void assertAdmin(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new SecurityException("로그인 정보가 없습니다.");
        }
        boolean isAdmin = userRepository.findById(userId.trim())
                .map(u -> "Y".equals(u.getAdminYn()))
                .orElse(false);
        if (!isAdmin) {
            throw new SecurityException("관리자 권한이 없습니다.");
        }
    }

    /** 요청값 검증 후 엔티티에 반영 */
    private void applyBannerRequest(CmAdBanner banner, AdBannerSaveRequestDto req) {
        // 위치코드
        String cd = req.getAdBannerCd() == null ? "" : req.getAdBannerCd().trim().toUpperCase();
        if (!BANNER_CD_PATTERN.matcher(cd).matches()) {
            throw new IllegalArgumentException("배너 위치코드는 영문 대문자/숫자/_ 20자 이내로 입력해 주세요.");
        }

        // 배너명
        String nm = req.getAdBannerNm() == null ? "" : req.getAdBannerNm().trim();
        if (nm.isEmpty()) {
            throw new IllegalArgumentException("배너명을 입력해 주세요.");
        }
        if (nm.length() > 400) {
            throw new IllegalArgumentException("배너명은 400자 이내로 입력해 주세요.");
        }

        // 링크 구분 및 URL (javascript: 등 위험한 스킴 차단)
        String targetFg = req.getLinkTargetFg() == null || req.getLinkTargetFg().isBlank() ? "I" : req.getLinkTargetFg().trim().toUpperCase();
        if (!"I".equals(targetFg) && !"O".equals(targetFg)) {
            throw new IllegalArgumentException("링크 이동 구분 값이 올바르지 않습니다.");
        }
        String linkUrl = req.getAdBannerLinkUrl() == null ? null : req.getAdBannerLinkUrl().trim();
        if (linkUrl != null && linkUrl.isEmpty()) {
            linkUrl = null;
        }
        if (linkUrl != null) {
            if (linkUrl.length() > 400) {
                throw new IllegalArgumentException("링크 URL은 400자 이내로 입력해 주세요.");
            }
            if ("O".equals(targetFg) && !EXTERNAL_URL_PATTERN.matcher(linkUrl).matches()) {
                throw new IllegalArgumentException("외부 링크는 http:// 또는 https:// 로 시작해야 합니다.");
            }
            if ("I".equals(targetFg) && (!linkUrl.startsWith("/") || linkUrl.startsWith("//") || linkUrl.matches(".*\\s.*"))) {
                throw new IllegalArgumentException("내부 화면 링크는 / 로 시작하는 경로로 입력해 주세요. (예: /main/clan)");
            }
        }

        // 정렬순서
        int sortSeq = req.getSortSeq() == null ? 1 : req.getSortSeq();
        if (sortSeq < 1 || sortSeq > 9999) {
            throw new IllegalArgumentException("노출 순서는 1 ~ 9999 사이로 입력해 주세요.");
        }

        // 노출기간
        LocalDate stt = parseYmd(req.getSttDate(), "노출 시작일");
        LocalDate end = parseYmd(req.getEndDate(), "노출 종료일");
        if (stt.isAfter(end)) {
            throw new IllegalArgumentException("노출 종료일은 시작일 이후여야 합니다.");
        }

        // 사용여부 / 상태코드
        String useYn = req.getUseYn() == null || req.getUseYn().isBlank() ? "Y" : req.getUseYn().trim().toUpperCase();
        if (!"Y".equals(useYn) && !"N".equals(useYn)) {
            throw new IllegalArgumentException("사용여부 값이 올바르지 않습니다.");
        }
        String statCd = req.getBannerStatCd() == null || req.getBannerStatCd().isBlank() ? BANNER_STAT_DISPLAY : req.getBannerStatCd().trim();
        if (!STAT_CD_PATTERN.matcher(statCd).matches()) {
            throw new IllegalArgumentException("배너 상태코드 값이 올바르지 않습니다.");
        }

        banner.setAdBannerCd(cd);
        banner.setAdBannerNm(nm);
        banner.setLinkTargetFg(targetFg);
        banner.setAdBannerLinkUrl(linkUrl);
        banner.setSortSeq(sortSeq);
        banner.setSttDate(stt.format(YMD));
        banner.setEndDate(end.format(YMD));
        banner.setUseYn(useYn);
        banner.setBannerStatCd(statCd);
    }

    private LocalDate parseYmd(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + "을 입력해 주세요.");
        }
        try {
            return LocalDate.parse(value.trim().replace("-", ""), YMD);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(label + " 형식이 올바르지 않습니다. (YYYYMMDD)");
        }
    }

    /** 배너 미디어는 이미지/영상만 허용 */
    private void validateBannerMedia(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.startsWith("image/") || contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("이미지 또는 영상 파일만 등록할 수 있습니다.");
        }
    }

    /** 첨부파일을 한 번에 조회해 DTO 변환 (배너별 개별 조회 방지) */
    private List<AdBannerDto> toBannerDtos(List<CmAdBanner> banners) {
        List<Long> attachNos = banners.stream()
                .map(CmAdBanner::getAttachNo)
                .filter(no -> no != null && no != 0)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, CmAttachment> attachMap = cmAttachmentRepository.findAllById(attachNos).stream()
                .collect(Collectors.toMap(CmAttachment::getAttachNo, a -> a, (a, b) -> a));
        return banners.stream()
                .map(b -> toBannerDto(b, attachMap))
                .collect(Collectors.toList());
    }

    private AdBannerDto toBannerDto(CmAdBanner banner, Map<Long, CmAttachment> attachMap) {
        CmAttachment attachment = null;
        if (banner.getAttachNo() != null && banner.getAttachNo() != 0) {
            attachment = attachMap != null
                    ? attachMap.get(banner.getAttachNo())
                    : cmAttachmentRepository.findById(banner.getAttachNo()).orElse(null);
        }
        return AdBannerDto.builder()
                .adBannerNo(banner.getAdBannerNo())
                .adBannerCd(banner.getAdBannerCd())
                .adBannerNm(banner.getAdBannerNm())
                .attachNo(banner.getAttachNo())
                .fileUrl(attachment != null ? attachment.getFilePath() : null)
                .mimeType(attachment != null ? attachment.getMimeType() : null)
                .adBannerLinkUrl(banner.getAdBannerLinkUrl())
                .linkTargetFg(banner.getLinkTargetFg())
                .sortSeq(banner.getSortSeq())
                .sttDate(banner.getSttDate())
                .endDate(banner.getEndDate())
                .useYn(banner.getUseYn())
                .bannerStatCd(banner.getBannerStatCd())
                .insDtime(banner.getInsDtime())
                .insId(banner.getInsId())
                .updDtime(banner.getUpdDtime())
                .updId(banner.getUpdId())
                .build();
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

        // 밴드 승인(확정) 시 자동 메시지 및 푸시 발송 (RQ/RJ -> CN 상태 변경 시에만)
        if ("CN".equals(status) && !"CN".equals(oldStatus)) {
            com.bandi.backend.dto.ChatMessageCreateDto chatDto = new com.bandi.backend.dto.ChatMessageCreateDto();
            chatDto.setCnNo(cnNo);
            chatDto.setSndUserId("snyun");
            chatDto.setMsg("밴드가 개설됐어요! 대화를 시작해보세요!");
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
                    // 2) 밴드 게시판: /main/clan/board/detail/2/3/182 또는 쿼리/패스구조
                    if (boardUrl.contains("clan")) {
                        // 밴드 게시판 게시글 처리
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
