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
import com.bandi.backend.repository.UserRepository;
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
    private final CmAttachmentRepository cmAttachmentRepository;
    private final ClanBoardTypeRepository clanBoardTypeRepository;
    private final com.bandi.backend.repository.ClanBoardRepository clanBoardRepository;
    private final com.bandi.backend.repository.ClanChatRoomRepository clanChatRoomRepository;

    // private final ClanNoticeRepository clanNoticeRepository;
    // private final ClanNoticeDetailRepository clanNoticeDetailRepository;
    // private final UserRepository userRepository;
    // private final UserAccountRepository userAccountRepository;
    private final com.bandi.backend.repository.ClanBoardAttachmentRepository clanBoardAttachmentRepository;
    private final com.bandi.backend.repository.ClanBoardDetailRepository clanBoardDetailRepository;
    private final com.bandi.backend.repository.ClanBoardLikeRepository clanBoardLikeRepository;
    private final com.bandi.backend.repository.ClanBoardDetailLikeRepository clanBoardDetailLikeRepository;

    @Transactional
    public Long createClan(ClanCreateDto dto, MultipartFile file) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        Long attachNo = null;

        // 1. Save File & CmAttachment if file exists
        if (file != null && !file.isEmpty()) {
            try {
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
    }

    @Transactional(readOnly = true)
    public String getMemberStatus(Long clanId, String userId) {
        return clanUserRepository.findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .map(ClanUser::getCnUserApprStatCd)
                .orElse("NONE");
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanMemberProjection> getClanMembers(Long clanId) {
        return clanGroupRepository.findClanMembers(clanId);
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
    public void updateMemberStatus(Long clanId, String userId, String status) {
        com.bandi.backend.entity.clan.ClanUser user = clanUserRepository
                .findById(new com.bandi.backend.entity.clan.ClanUserId(clanId, userId))
                .orElseThrow(() -> new RuntimeException("Member not found"));
        user.setCnUserApprStatCd(status);
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
    public com.bandi.backend.dto.ClanBoardDetailDto getBoardPostDetail(Long boardNo) {
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
        dto.setTitle((String) result.get("title"));
        dto.setContent((String) result.get("content")); // Clob handling might be needed but driver usually handles
                                                        // string
        dto.setWriterUserId((String) result.get("writerUserId"));
        dto.setUserNickNm((String) result.get("userNickNm"));
        dto.setRegDate((String) result.get("regDate"));
        dto.setYoutubeUrl((String) result.get("youtubeUrl"));
        dto.setViewCnt(0L); // No view cnt
        dto.setLikeCnt(((Number) result.get("boardLikeCnt")).longValue());
        dto.setReplyCnt(((Number) result.get("boardReplyCnt")).longValue());

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
            if (c.getUser() != null) {
                dto.setUserNickNm(c.getUser().getUserNickNm());
            } else {
                dto.setUserNickNm(c.getReplyUserId()); // Fallback
            }

            dto.setParentReplyNo(c.getParentReplyNo());

            // Set Counts
            dto.setChildReplyCount(childCountMap.getOrDefault(c.getCnReplyNo(), 0L));
            dto.setLikeCount(finalLikeCountMap.getOrDefault(c.getCnReplyNo(), 0L));

            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void createComment(Long boardNo, String userId, String content, Long parentReplyNo) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        com.bandi.backend.entity.clan.ClanBoardDetail comment = new com.bandi.backend.entity.clan.ClanBoardDetail();
        comment.setCnBoardNo(boardNo);
        comment.setReplyUserId(userId);
        comment.setContent(content);
        comment.setReplyStatCd("A");
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
}
