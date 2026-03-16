package com.bandi.backend.service;

import com.bandi.backend.dto.ClanCreateDto;
import com.bandi.backend.entity.clan.ClanGroup;
import com.bandi.backend.entity.clan.ClanUser;
import com.bandi.backend.entity.clan.ClanBoardType;
import com.bandi.backend.repository.ClanBoardTypeRepository;
import com.bandi.backend.repository.ClanGroupRepository;
import com.bandi.backend.repository.ClanUserRepository;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.repository.CmAttachmentRepository;
import com.bandi.backend.repository.CmScrapRepository;
import com.bandi.backend.repository.UserRepository;
import com.bandi.backend.service.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClanService {

    @jakarta.persistence.PersistenceContext
    private final jakarta.persistence.EntityManager entityManager;

    private final ClanGroupRepository clanGroupRepository;
    private final ClanUserRepository clanUserRepository;
    private final PushService pushService;
    private final CmAttachmentRepository cmAttachmentRepository;
    private final ClanBoardTypeRepository clanBoardTypeRepository;
    private final com.bandi.backend.repository.ClanBoardRepository clanBoardRepository;
    private final com.bandi.backend.repository.ClanChatRoomRepository clanChatRoomRepository;

    private final UserRepository userRepository;
    // private final UserAccountRepository userAccountRepository;
    private final com.bandi.backend.repository.ClanBoardAttachmentRepository clanBoardAttachmentRepository;
    private final com.bandi.backend.repository.ClanBoardDetailRepository clanBoardDetailRepository;
    private final com.bandi.backend.repository.ClanBoardLikeRepository clanBoardLikeRepository;
    private final com.bandi.backend.repository.ClanBoardDetailLikeRepository clanBoardDetailLikeRepository;
    private final CmScrapRepository cmScrapRepository;

    @Transactional
    public Long createClan(ClanCreateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        Long attachNo = null;

        // 1. Save File & CmAttachment if file exists
        if (file != null && !file.isEmpty()) {
            try {
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
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                attachNo = savedAttachment.getAttachNo();

            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        // 2. Save CN_GROUP
        ClanGroup clan = new ClanGroup();
        clan.setCnNm(dto.getCnNm());
        clan.setCnDesc(dto.getCnDesc());
        clan.setCnUrl(dto.getCnUrl());
        clan.setCnOwdUserId(dto.getUserId());
        clan.setCnApprStatCd("RQ"); // Required: RQ
        clan.setCnStatCd("A"); // Required: A
        clan.setInsDtime(currentDateTime);
        clan.setInsId(dto.getUserId());
        clan.setUpdDtime(currentDateTime);
        clan.setUpdId(dto.getUserId());
        clan.setAttachNo(attachNo); // Link attachment to clan

        ClanGroup savedClan = clanGroupRepository.save(clan);

        // 3. Save CN_USER
        ClanUser clanMember = new ClanUser();
        clanMember.setCnNo(savedClan.getCnNo());
        clanMember.setCnUserId(dto.getUserId());
        clanMember.setCnUserRoleCd("01"); // Required: 01 (Clan Leader)
        clanMember.setCnJoinDate(todayDate);
        clanMember.setCnUserStatCd("A"); // Required: A
        clanMember.setCnUserApprStatCd("CN"); // Required: CN (Confirmed)
        clanMember.setInsDtime(currentDateTime);
        clanMember.setInsId(dto.getUserId());
        clanMember.setUpdDtime(currentDateTime);
        clanMember.setUpdId(dto.getUserId());

        clanUserRepository.save(clanMember);

        // 4. Save CN_CHAT_ROOM (Native Query to force INSERT with manual ID)
        String insertChatRoomSql = """
                    INSERT INTO CN_CHAT_ROOM (CN_NO, CN_ROOM_NM, INS_DTIME, INS_ID, UPD_DTIME, UPD_ID)
                    VALUES (:cnNo, :cnRoomNm, :insDtime, :insId, :updDtime, :updId)
                """;

        entityManager.createNativeQuery(insertChatRoomSql)
                .setParameter("cnNo", savedClan.getCnNo())
                .setParameter("cnRoomNm", dto.getCnNm())
                .setParameter("insDtime", currentDateTime)
                .setParameter("insId", dto.getUserId())
                .setParameter("updDtime", currentDateTime)
                .setParameter("updId", dto.getUserId())
                .executeUpdate();

        return savedClan.getCnNo();
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanListDto> getClanList(String name) {
        if (name != null && !name.trim().isEmpty()) {
            return clanGroupRepository.findActiveClansByName(name);
        }
        return clanGroupRepository.findAllActiveClans();
    }

    @Transactional(readOnly = true)
    public com.bandi.backend.dto.ClanListDto getMyClan(String userId) {
        org.springframework.data.domain.Pageable limit = org.springframework.data.domain.PageRequest.of(0, 1);
        java.util.List<com.bandi.backend.dto.ClanListDto> result = clanGroupRepository.findMyClan(userId, limit);
        if (result.isEmpty()) {
            return null;
        }
        return result.get(0);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanListDto> getMyClanList(String userId) {
        return clanGroupRepository.findAllMyClans(userId);
    }

    @Transactional(readOnly = true)
    public com.bandi.backend.dto.ClanListDto getClanDetail(Long clanId, String userId) {
        com.bandi.backend.dto.ClanListDto dto = clanGroupRepository.findClanDetail(clanId, userId).orElse(null);
        if (dto != null)
            System.out.println(
                    "DEBUG: fetchClanDetail ID=" + clanId + " User=" + userId + " Count=" + dto.getUnreadChatCount());
        return dto;
    }

    @Transactional
    public void joinClan(com.bandi.backend.dto.ClanJoinDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // Check if already a member (Optional validation)
        boolean exists = clanUserRepository
                .existsById(new com.bandi.backend.entity.clan.ClanUserId(dto.getCnNo(), dto.getUserId()));
        if (exists) {
            throw new RuntimeException("User is already a member of this clan.");
        }

        ClanUser clanMember = new ClanUser();
        clanMember.setCnNo(dto.getCnNo());
        clanMember.setCnUserId(dto.getUserId());
        clanMember.setCnUserRoleCd("03"); // Required: 03 (Applicant)
        clanMember.setCnJoinDate(todayDate);
        clanMember.setCnUserStatCd("A"); // Required: A (Active)
        clanMember.setCnUserApprStatCd("RQ"); // Required: RQ (Requested)
        clanMember.setInsDtime(currentDateTime);
        clanMember.setInsId(dto.getUserId());
        clanMember.setUpdDtime(currentDateTime);
        clanMember.setUpdId(dto.getUserId());

        clanUserRepository.save(clanMember);

        // Send push notification to Leader(01) and Executive(02)
        try {
            // Get Applicant's Nickname
            String applicantNickname = userRepository.findById(dto.getUserId())
                    .map(u -> (u.getUserNickNm() != null && !u.getUserNickNm().isEmpty()) ? u.getUserNickNm() : u.getUserNm())
                    .orElse("새로운 회원");

            java.util.List<com.bandi.backend.entity.clan.ClanUser> admins = clanUserRepository.findAllByCnNoAndCnUserRoleCdIn(
                    dto.getCnNo(), java.util.Arrays.asList("01", "02"));
            for (com.bandi.backend.entity.clan.ClanUser admin : admins) {
                pushService.sendPush(
                        admin.getCnUserId(),
                        "클랜 신청 알림",
                        applicantNickname + "님이 클랜 신규 회원 가입을 요청을 했습니다.",
                        "", // No link as requested
                        "CLAN_JOIN"
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to send clan join push notification: " + e.getMessage());
            // Don't throw exception to avoid rolling back the join request itself
        }
    }

    @Transactional(readOnly = true)
    public String getMemberStatus(Long clanId, String userId) {
        return clanUserRepository.findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .map(ClanUser::getCnUserApprStatCd)
                .orElse("NONE");
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanMemberDetailDto> getClanMembers(Long clanId) {
        // 1. Fetch Members
        java.util.List<com.bandi.backend.dto.ClanMemberProjection> members = clanGroupRepository
                .findClanMembers(clanId);

        // 2. Fetch Sessions
        java.util.List<com.bandi.backend.dto.MemberSessionDto> sessions = clanGroupRepository
                .findAllMemberSessions(clanId);

        // 3. Helper to decode Session Type (Part)
        java.util.Map<String, String> partNameMap = new java.util.HashMap<>();
        // Fetch known codes mapping (optimizing DB calls or reusing existing logic)
        // For efficiency, we could fetch all relevant codes or just rely on 'getIcon'
        // frontend logic if we pass raw code.
        // But user requirement implies "Part Name" might be needed.
        // Let's reuse getSessionName helper logic or similar bulk fetch.
        // Since we are inside service, we can use entityManager.
        try {
            String sql = "SELECT COMM_DETAIL_CD, COMM_DETAIL_NM FROM CM_COMM_DETAIL WHERE COMM_CD = 'BD100'";
            java.util.List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();
            for (Object[] row : results) {
                partNameMap.put((String) row[0], (String) row[1]);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch session names map: " + e.getMessage());
        }

        // 4. Map Sessions to Members
        java.util.Map<String, java.util.List<com.bandi.backend.dto.MemberSessionDto>> sessionsByUserId = sessions
                .stream()
                .peek(s -> s.setPart(partNameMap.getOrDefault(s.getSessionTypeCd(), s.getSessionTypeCd()))) // Decode
                .collect(java.util.stream.Collectors.groupingBy(com.bandi.backend.dto.MemberSessionDto::getUserId));

        // 5. Build Result DTOs
        return members.stream().map(m -> com.bandi.backend.dto.ClanMemberDetailDto.builder()
                .cnNo(m.getCnNo())
                .cnUserId(m.getCnUserId())
                .cnUserRoleCd(m.getCnUserRoleCd())
                .cnUserApprStatCd(m.getCnUserApprStatCd())
                .userNm(m.getUserNm())
                .userNickNm(m.getUserNickNm())
                .sessions(sessionsByUserId.getOrDefault(m.getCnUserId(), new java.util.ArrayList<>()))
                .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getMemberRole(Long clanId, String userId) {
        String role = clanUserRepository.findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        System.out.println("DEBUG: getMemberRole clanId=" + clanId + " userId=" + userId + " role=" + role);
        return role;
    }

    @Transactional
    public void updateMemberStatus(Long clanId, String userId, String status, String updId) {
        com.bandi.backend.entity.clan.ClanUser user = clanUserRepository
                .findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .orElseThrow(() -> new RuntimeException("Member not found"));

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        if ("RJ".equals(status)) {
            user.setCnUserStatCd("D"); // Deleted/Kicked
            user.setCnUserApprStatCd("RJ"); // Rejected/Kicked
        } else {
            user.setCnUserApprStatCd(status);
        }

        user.setUpdDtime(currentDateTime);
        user.setUpdId(updId);

        clanUserRepository.save(user);
    }

    @Transactional
    public void updateMemberRole(Long clanId, String userId, String role) {
        // If promoting to Leader (01), handle leadership transfer
        if ("01".equals(role)) {
            // Find current leader
            com.bandi.backend.entity.clan.ClanUser currentLeader = clanUserRepository
                    .findByCnNoAndCnUserRoleCd(clanId, "01")
                    .orElse(null);

            // Demote current leader to Executive (02)
            if (currentLeader != null && !currentLeader.getCnUserId().equals(userId)) {
                currentLeader.setCnUserRoleCd("02");
                clanUserRepository.save(currentLeader);
            }
        }

        com.bandi.backend.entity.clan.ClanUser user = clanUserRepository
                .findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .orElseThrow(() -> new RuntimeException("Member not found"));

        user.setCnUserRoleCd(role);
        clanUserRepository.save(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<ClanBoardType> getClanBoardTypeList(Long clanId) {
        return clanBoardTypeRepository.findByCnNoAndBoardTypeStatCd(clanId, "A");
    }

    @Transactional
    public void createClanBoardType(com.bandi.backend.dto.ClanBoardTypeCreateDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        ClanBoardType boardType = new ClanBoardType();
        boardType.setCnNo(dto.getCnNo());
        boardType.setCnBoardTypeNm(dto.getCnBoardTypeNm());
        boardType.setBoardTypeStatCd("A");
        boardType.setInsDtime(currentDateTime);
        boardType.setInsId(dto.getUserId());
        boardType.setUpdDtime(currentDateTime);
        boardType.setUpdId(dto.getUserId());

        clanBoardTypeRepository.save(boardType);
    }

    @Transactional
    public void deleteClanBoardType(Long clanId, Long boardTypeNo, String userId) {
        // 1. Check Authority (Clan Leader '01' or Executive '02')
        String role = getMemberRole(clanId, userId);
        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜장 또는 간부만 게시판을 삭제할 수 있습니다.");
        }

        // 2. Find Board Type
        ClanBoardType boardType = clanBoardTypeRepository.findById(boardTypeNo)
                .orElseThrow(() -> new RuntimeException("Board type not found"));

        // 3. Update Status to 'D' (Delete)
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        boardType.setBoardTypeStatCd("D");
        boardType.setUpdDtime(currentDateTime);
        boardType.setUpdId(userId);

        clanBoardTypeRepository.save(boardType);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.HotBoardPostDto> getHotBoardPosts(Long clanId) {
        return clanBoardRepository.findHotBoardPosts(clanId);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.HotBoardPostDto> getTopBoardPosts(Long clanId) {
        return clanBoardRepository.findTopBoardPosts(clanId);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.BoardPostDto> getBoardPostList(Long boardTypeNo, String keyword) {
        return clanBoardRepository.findPostsByBoardType(boardTypeNo, keyword);
    }

    @Transactional
    public void createBoardPost(com.bandi.backend.dto.ClanBoardCreateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        Long attachNo = null;

        System.out
                .println("DEBUG: createBoardPost start. Title=" + dto.getTitle() + ", Youtube=" + dto.getYoutubeUrl());

        // 1. Save File & CmAttachment if file exists
        if (file != null && !file.isEmpty()) {
            try {
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
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                attachNo = savedAttachment.getAttachNo();
                System.out.println("DEBUG: Attachment saved. attachNo=" + attachNo);

            } catch (IOException e) {
                System.err.println("ERROR: Failed to save file: " + e.getMessage());
                throw new RuntimeException("Failed to store file", e);
            }
        }

        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        com.bandi.backend.entity.clan.ClanBoard board = new com.bandi.backend.entity.clan.ClanBoard();
        board.setCnNo(dto.getCnNo());
        board.setCnBoardTypeNo(dto.getCnBoardTypeNo());
        board.setWriterUserId(dto.getUserId());
        board.setTitle(dto.getTitle());
        board.setContent(dto.getContent());
        board.setYoutubeUrl(dto.getYoutubeUrl() != null ? dto.getYoutubeUrl() : "");
        board.setRegDate(todayDate);
        board.setBoardStatCd("A");
        board.setPinYn("N");
        board.setMaskingYn(dto.getMaskingYn() != null ? dto.getMaskingYn() : "N");
        board.setInsDtime(currentDateTime);
        board.setInsId(dto.getUserId());
        board.setUpdDtime(currentDateTime);
        board.setUpdId(dto.getUserId());

        com.bandi.backend.entity.clan.ClanBoard savedBoard = clanBoardRepository.save(board);
        System.out.println("DEBUG: Board saved. cnBoardNo=" + savedBoard.getCnBoardNo());

        // 3. Save ClanBoardAttachment if attachment exists
        if (attachNo != null) {
            com.bandi.backend.entity.clan.ClanBoardAttachment boardAttachment = new com.bandi.backend.entity.clan.ClanBoardAttachment();
            boardAttachment.setCnBoardNo(savedBoard.getCnBoardNo());
            boardAttachment.setAttachNo(attachNo);
            boardAttachment.setAttachStatCd("A");
            boardAttachment.setInsDtime(currentDateTime);
            boardAttachment.setInsId(dto.getUserId());
            boardAttachment.setUpdDtime(currentDateTime);
            boardAttachment.setUpdId(dto.getUserId());

            clanBoardAttachmentRepository.save(boardAttachment);
            System.out.println(
                    "DEBUG: BoardAttachment saved. cnBoardNo=" + savedBoard.getCnBoardNo() + ", attachNo=" + attachNo);
        }
    }

    @Transactional
    public com.bandi.backend.dto.ClanBoardDetailDto getBoardPostDetail(Long boardNo, String userId) {
        // Increment View Count
        com.bandi.backend.entity.clan.ClanBoard board = clanBoardRepository.findById(boardNo)
                .orElseThrow(() -> new RuntimeException("Board not found"));
        // Using direct SQL update for view count to avoid full entity update overhead,
        // or save entity.
        // For simplicity, strict entity save.
        // board.setViewCnt(board.getViewCnt() + 1); // viewCnt removed from entity? No,
        // I decided to remove it but DB has it?
        // Wait, user said "VIEW_CNT 필드는 제거해주고". So I should NOT increment viewCnt.
        // User said: "첫째. VIEW_CNT 필드는 제거해주고"
        // So no view count logic.

        java.util.Map<String, Object> result = clanBoardRepository.findBoardDetailMap(boardNo);
        if (result == null)
            return null;

        com.bandi.backend.dto.ClanBoardDetailDto dto = new com.bandi.backend.dto.ClanBoardDetailDto();
        dto.setCnBoardNo(((Number) result.get("cnBoardNo")).longValue());

        Number bTypeNo = (Number) result.get("cnBoardTypeNo");
        if (bTypeNo != null)
            dto.setCnBoardTypeNo(bTypeNo.longValue());

        Object bTypeNmObj = result.get("boardTypeNm");
        dto.setBoardTypeNm(bTypeNmObj != null ? String.valueOf(bTypeNmObj) : "클랜 게시판");

        dto.setTitle(result.get("title") != null ? String.valueOf(result.get("title")) : "");
        dto.setContent(result.get("content") != null ? String.valueOf(result.get("content")) : "");
        dto.setWriterUserId(result.get("writerUserId") != null ? String.valueOf(result.get("writerUserId")) : "");
        dto.setUserNickNm(result.get("userNickNm") != null ? String.valueOf(result.get("userNickNm")) : "");
        dto.setRegDate(result.get("regDate") != null ? String.valueOf(result.get("regDate")) : "");
        dto.setYoutubeUrl(result.get("youtubeUrl") != null ? String.valueOf(result.get("youtubeUrl")) : "");
        dto.setViewCnt(0L); // No view cnt
        dto.setLikeCnt(((Number) result.get("boardLikeCnt")).longValue());
        dto.setReplyCnt(((Number) result.get("boardReplyCnt")).longValue());

        long scrapCnt = cmScrapRepository.countByScrapTableNmAndScrapTablePkNo("CN_BOARD", boardNo);
        boolean isScrapped = !userId.isEmpty()
                && cmScrapRepository.existsByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CN_BOARD", boardNo);
        dto.setScrapCnt(scrapCnt);
        dto.setIsScrapped(isScrapped);

        // Fetch user nickname if not in map (just safety, map should have it from
        // query)
        if (dto.getUserNickNm() == null) {
            dto.setUserNickNm(dto.getWriterUserId());
        }

        // Fetch attachment if exists
        String attachFilePath = null;
        // Assuming one attachment per board for now
        java.util.List<com.bandi.backend.entity.clan.ClanBoardAttachment> attachments = clanBoardAttachmentRepository
                .findByCnBoardNoAndAttachStatCd(boardNo, "A");

        if (!attachments.isEmpty()) {
            Long attachNo = attachments.get(0).getAttachNo();
            CmAttachment cmAttachment = cmAttachmentRepository.findById(attachNo).orElse(null);
            if (cmAttachment != null) {
                attachFilePath = cmAttachment.getFilePath();
            }
        }
        dto.setAttachFilePath(attachFilePath);
        dto.setMaskingYn(result.get("maskingYn") != null ? String.valueOf(result.get("maskingYn")) : "N");

        return dto;
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanBoardCommentDto> getBoardComments(Long boardNo) {
        java.util.List<com.bandi.backend.entity.clan.ClanBoardDetail> comments = clanBoardDetailRepository
                .findCommentsByBoardNo(boardNo);

        // 1. Get Child Reply Counts
        java.util.List<Object[]> childCounts = clanBoardDetailRepository.countChildRepliesByBoardNo(boardNo);
        java.util.Map<Long, Long> childCountMap = childCounts.stream()
                .collect(java.util.stream.Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]));

        // 2. Get Like Counts
        java.util.List<Long> replyIds = comments.stream()
                .map(com.bandi.backend.entity.clan.ClanBoardDetail::getCnReplyNo)
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<Long, Long> likeCountMap = new java.util.HashMap<>();
        if (!replyIds.isEmpty()) {
            java.util.List<Object[]> likeCounts = clanBoardDetailLikeRepository.countLikesByReplyIds(replyIds);
            likeCountMap = likeCounts.stream()
                    .collect(java.util.stream.Collectors.toMap(
                            row -> (Long) row[0],
                            row -> (Long) row[1]));
        }

        // Final copy for lambda
        java.util.Map<Long, Long> finalLikeCountMap = likeCountMap;

        return comments.stream().map(c -> {
            com.bandi.backend.dto.ClanBoardCommentDto dto = new com.bandi.backend.dto.ClanBoardCommentDto();
            dto.setCnReplyNo(c.getCnReplyNo());
            dto.setCnBoardNo(c.getCnBoardNo());
            dto.setContent(c.getContent());
            dto.setWriterUserId(c.getReplyUserId());
            dto.setRegDate(c.getInsDtime());

            // Use User relation for nickname
            if ("Y".equals(c.getMaskingYn())) {
                dto.setUserNickNm("익명");
            } else if (c.getUser() != null) {
                dto.setUserNickNm(c.getUser().getUserNickNm());
            } else {
                dto.setUserNickNm(c.getReplyUserId()); // Fallback
            }
            dto.setMaskingYn(c.getMaskingYn());

            dto.setParentReplyNo(c.getParentReplyNo());

            // Set Counts
            dto.setChildReplyCount(childCountMap.getOrDefault(c.getCnReplyNo(), 0L));
            dto.setLikeCount(finalLikeCountMap.getOrDefault(c.getCnReplyNo(), 0L));

            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void createComment(Long boardNo, String userId, String content, Long parentReplyNo, String maskingYn) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        com.bandi.backend.entity.clan.ClanBoardDetail comment = new com.bandi.backend.entity.clan.ClanBoardDetail();
        comment.setCnBoardNo(boardNo);
        comment.setReplyUserId(userId);
        comment.setContent(content);
        comment.setReplyStatCd("A");
        comment.setMaskingYn(maskingYn != null ? maskingYn : "N");
        comment.setInsDtime(currentDateTime);
        comment.setInsId(userId);
        comment.setUpdDtime(currentDateTime);
        comment.setUpdId(userId);

        if (parentReplyNo != null) {
            com.bandi.backend.entity.clan.ClanBoardDetail parent = clanBoardDetailRepository.findById(parentReplyNo)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));

            // Depth Validation: Cannot reply to a comment that is already a reply (Max
            // Depth 2)
            if (parent.getParentReplyNo() != null) {
                throw new RuntimeException("Cannot reply to a child comment (Max allowed depth is 2).");
            }
            comment.setParentReplyNo(parentReplyNo);
        }

        clanBoardDetailRepository.save(comment);
    }

    @Transactional
    public void addBoardLike(Long boardNo, String userId) {
        // Check if already liked
        if (clanBoardLikeRepository.existsByCnBoardNoAndUserId(boardNo, userId)) {
            clanBoardLikeRepository.deleteByCnBoardNoAndUserId(boardNo, userId);
            return;
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        com.bandi.backend.entity.clan.ClanBoardLike like = new com.bandi.backend.entity.clan.ClanBoardLike();
        like.setCnBoardNo(boardNo);
        like.setUserId(userId);
        like.setInsDtime(currentDateTime);
        like.setInsId(userId);
        like.setUpdDtime(currentDateTime);
        like.setUpdId(userId);

        clanBoardLikeRepository.save(like);
    }

    @Transactional
    public void addCommentLike(Long replyNo, String userId) {
        // Check if already liked
        if (clanBoardDetailLikeRepository.existsByCnReplyNoAndUserId(replyNo, userId)) {
            clanBoardDetailLikeRepository.deleteByCnReplyNoAndUserId(replyNo, userId);
            return;
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        com.bandi.backend.entity.clan.ClanBoardDetail comment = clanBoardDetailRepository.findById(replyNo)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        com.bandi.backend.entity.clan.ClanBoardDetailLike like = new com.bandi.backend.entity.clan.ClanBoardDetailLike();
        like.setCnReplyNo(replyNo);
        like.setCnBoardNo(comment.getCnBoardNo());
        like.setUserId(userId);
        like.setInsDtime(currentDateTime);
        like.setInsId(userId);
        like.setUpdDtime(currentDateTime);
        like.setUpdId(userId);

        clanBoardDetailLikeRepository.save(like);
    }

    @Transactional
    public void updateClan(Long clanId, com.bandi.backend.dto.ClanUpdateDto dto, MultipartFile file) {
        // 1. Permission Check
        String role = getMemberRole(clanId, dto.getUserId());
        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜장 또는 간부만 클랜 정보를 수정할 수 있습니다.");
        }

        ClanGroup clan = clanGroupRepository.findById(clanId)
                .orElseThrow(() -> new RuntimeException("Clan not found"));

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 2. Update Image if provided
        if (file != null && !file.isEmpty()) {
            try {
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
                attachment.setInsId(dto.getUserId());
                attachment.setUpdDtime(currentDateTime);
                attachment.setUpdId(dto.getUserId());

                CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);
                clan.setAttachNo(savedAttachment.getAttachNo());

            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        // 3. Update Text Fields
        if (dto.getCnNm() != null && !dto.getCnNm().isBlank()) {
            clan.setCnNm(dto.getCnNm());
        }
        if (dto.getCnDesc() != null) {
            clan.setCnDesc(dto.getCnDesc());
        }
        if (dto.getCnUrl() != null) {
            clan.setCnUrl(dto.getCnUrl());
        }

        clan.setUpdDtime(currentDateTime);
        clan.setUpdId(dto.getUserId());

        clanGroupRepository.save(clan);
    }

    @Transactional
    public void toggleScrap(Long boardNo, String userId) {
        if (cmScrapRepository.existsByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CN_BOARD", boardNo)) {
            cmScrapRepository.deleteByUserIdAndScrapTableNmAndScrapTablePkNo(userId, "CN_BOARD", boardNo);
        } else {
            String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            com.bandi.backend.entity.member.CmScrap scrap = new com.bandi.backend.entity.member.CmScrap();
            scrap.setUserId(userId);
            scrap.setScrapTableNm("CN_BOARD");
            scrap.setScrapTablePkNo(boardNo);
            scrap.setScrapDate(currentDateTime.substring(0, 8));
            scrap.setInsDtime(currentDateTime);
            scrap.setInsId(userId);
            scrap.setUpdDtime(currentDateTime);
            scrap.setUpdId(userId);
            cmScrapRepository.save(scrap);
        }
    }

    @Transactional
    public void deleteBoardPost(Long boardNo, Long clanId, String userId) {
        System.out.println("DEBUG: deleteBoardPost boardNo=" + boardNo + " clanId=" + clanId + " userId=" + userId);

        com.bandi.backend.entity.clan.ClanBoard board = clanBoardRepository.findById(boardNo)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다. (ID: " + boardNo + ")"));

        // 클랜 일치 확인
        if (clanId != null && !clanId.equals(board.getCnNo())) {
            throw new RuntimeException("해당 클랜의 게시글이 아닙니다.");
        }

        System.out.println("DEBUG: found board writerUserId=" + board.getWriterUserId() + " boardStatCd="
                + board.getBoardStatCd());

        if ("D".equals(board.getBoardStatCd())) {
            throw new RuntimeException("이미 삭제된 게시글입니다.");
        }

        // 권한 확인: 작성자, 클랜장(01), 간부(02)만 삭제 가능
        boolean isAuthor = userId.equals(board.getWriterUserId());
        boolean hasPrivilege = false;

        if (!isAuthor && clanId != null) {
            String role = clanUserRepository
                    .findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                    .map(ClanUser::getCnUserRoleCd)
                    .orElse("NONE");
            System.out.println("DEBUG: userId=" + userId + " clanRole=" + role);
            hasPrivilege = "01".equals(role) || "02".equals(role);
        }

        if (!isAuthor && !hasPrivilege) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        board.setBoardStatCd("D");
        board.setUpdDtime(currentDateTime);
        board.setUpdId(userId);
        clanBoardRepository.save(board);
        System.out.println("DEBUG: board soft-deleted successfully boardNo=" + boardNo);
    }

    public java.util.Map<String, Object> getDebugMap(Long boardNo) {
        return clanBoardRepository.findBoardDetailMap(boardNo);
    }
}
