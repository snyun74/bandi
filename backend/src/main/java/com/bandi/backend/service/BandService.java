package com.bandi.backend.service;

import com.bandi.backend.dto.BandCreateRequestDto;
import com.bandi.backend.entity.band.BnGroup;
import com.bandi.backend.entity.band.BnSession;
import com.bandi.backend.entity.band.BnUser;
import com.bandi.backend.repository.BnGroupRepository;
import com.bandi.backend.repository.BnSessionRepository;
import com.bandi.backend.repository.BnUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.bandi.backend.dto.BandDetailDto;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class BandService {

    private final BnGroupRepository bnGroupRepository;
    private final BnUserRepository bnUserRepository;
    private final BnSessionRepository bnSessionRepository;
    private final com.bandi.backend.repository.ClanUserRepository clanUserRepository;
    private final com.bandi.backend.repository.CmAttachmentRepository cmAttachmentRepository;
    private final com.bandi.backend.repository.BandChatRoomRepository bandChatRoomRepository;

    @Transactional
    public Long createBand(BandCreateRequestDto dto) {
        String userId = dto.getUserId();
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 1. Save BN_GROUP
        BnGroup group = new BnGroup();
        group.setBnType(dto.getClanId() != null ? "CLAN" : "NORL");
        group.setCnNo(dto.getClanId());
        group.setBnNm(dto.getTitle());
        group.setBnSongNm(dto.getSongTitle());
        group.setBnSingerNm(dto.getArtist());
        group.setBnPasswdFg(dto.isSecret() ? "Y" : "N");
        if (dto.isSecret()) {
            group.setBnPasswd(dto.getPassword());
        }
        group.setBnDesc(dto.getDescription());
        group.setBnLeaderId(userId);
        group.setBnConfFg("N"); // Default N
        group.setBnStatCd("A");
        if (dto.getAttachNo() != null) {
            group.setAttachNo(dto.getAttachNo());
        }
        group.setInsDtime(currentDateTime);
        group.setInsId(userId);
        group.setUpdDtime(currentDateTime);
        group.setUpdId(userId);

        BnGroup savedGroup = bnGroupRepository.save(group);
        Long bnNo = savedGroup.getBnNo();

        // 2. Save BN_USER (Leader)
        BnUser user = new BnUser();
        user.setBnNo(bnNo);
        user.setBnUserId(userId);
        user.setBnRoleCd("LEAD");
        user.setBnJoinDate(currentDate);
        user.setBnUserStatCd("A");
        user.setInsDtime(currentDateTime);
        user.setInsId(userId);
        user.setUpdDtime(currentDateTime);
        user.setUpdId(userId);

        bnUserRepository.save(user);

        // 3. Save BN_SESSION (Basic + Custom)
        if (dto.getSessions() != null) {
            for (String sessionCode : dto.getSessions()) {
                BnSession session = new BnSession();
                session.setBnNo(bnNo);
                session.setBnSessionTypeCd(sessionCode);
                // bnSessionJoinUserId is default NULL
                session.setInsDtime(currentDateTime);
                session.setInsId(userId);
                session.setUpdDtime(currentDateTime);
                session.setUpdId(userId);

                bnSessionRepository.save(session);
            }
        }

        // 4. Create Chat Room
        com.bandi.backend.entity.band.BandChatRoom chatRoom = new com.bandi.backend.entity.band.BandChatRoom();
        chatRoom.setBnNo(bnNo);
        chatRoom.setBnRoomNm(dto.getTitle());
        chatRoom.setInsDtime(currentDateTime);
        chatRoom.setInsId(userId);
        chatRoom.setUpdDtime(currentDateTime);
        chatRoom.setUpdId(userId);

        bandChatRoomRepository.save(chatRoom);

        return bnNo;
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanJamListDto> getClanBandList(Long clanId, String userId,
            String keyword, String sort, String filterPart) {
        log.info("Fetching band list for clanId: {}, userId: {}, keyword: {}, sort: {}, filterPart: {}", clanId, userId,
                keyword, sort, filterPart);

        // Fetch all active bands for the clan
        java.util.List<BnGroup> allGroups = bnGroupRepository.findAll();
        log.info("Total groups found: {}", allGroups.size());

        java.util.List<BnGroup> groups = allGroups.stream()
                .filter(g -> {
                    boolean isStatA = "A".equals(g.getBnStatCd());
                    boolean isClanMatch = (clanId == null && g.getCnNo() == null)
                            || (clanId != null && clanId.equals(g.getCnNo()));

                    if (!isStatA || !isClanMatch) {
                        return false;
                    }

                    if (keyword != null && !keyword.isEmpty()) {
                        if (g.getBnNm() == null || !g.getBnNm().contains(keyword)) {
                            return false;
                        }
                    }

                    // User Request: BN_CONF_FG IN ('N', 'Y') for Table View (Applying globally for
                    // consistency)
                    String confFg = g.getBnConfFg();
                    if (confFg == null || (!"N".equals(confFg) && !"Y".equals(confFg))) {
                        return false;
                    }

                    return true;
                })
                .sorted((b1, b2) -> b2.getBnNo().compareTo(b1.getBnNo())) // Initial sort by desc
                .collect(java.util.stream.Collectors.toList());

        log.info("Filtered groups count: {}", groups.size());

        java.util.List<com.bandi.backend.dto.ClanJamListDto> result = new java.util.ArrayList<>();
        java.util.Map<String, Integer> sessionOrderMap = getSessionOrderMap();

        for (BnGroup group : groups) {
            java.util.List<BnSession> sessions = bnSessionRepository.findAll().stream()
                    .filter(s -> s.getBnNo().equals(group.getBnNo()))
                    .collect(java.util.stream.Collectors.toList());

            java.util.List<com.bandi.backend.dto.ClanJamListDto.JamRoleDto> roleDtos = new java.util.ArrayList<>();
            boolean isFull = true;
            boolean isMember = group.getBnLeaderId().equals(userId);

            for (BnSession session : sessions) {
                String sessionName = getSessionName(session.getBnSessionTypeCd());
                String userNick = null;
                String status = "empty";
                boolean isCurrentUser = false;

                if (session.getBnSessionJoinUserId() != null) {
                    userNick = getUserNickname(session.getBnSessionJoinUserId());
                    status = "occupied";
                    if (session.getBnSessionJoinUserId().equals(userId)) {
                        isCurrentUser = true;
                        isMember = true;
                    }
                } else {
                    isFull = false;
                }

                roleDtos.add(com.bandi.backend.dto.ClanJamListDto.JamRoleDto.builder()
                        .sessionNo(session.getBnSessionNo())
                        .sessionTypeCd(session.getBnSessionTypeCd())
                        .part(sessionName)
                        .user(userNick)
                        .status(status)
                        .isCurrentUser(isCurrentUser)
                        .reservedCount(0)
                        .build());
            }

            // Sort roles: 1. comm_order (via map), 2. comm_detail_cd
            roleDtos.sort(java.util.Comparator.comparingInt(
                    (com.bandi.backend.dto.ClanJamListDto.JamRoleDto role) -> sessionOrderMap.getOrDefault(
                            role.getSessionTypeCd(), 999))
                    .thenComparing(com.bandi.backend.dto.ClanJamListDto.JamRoleDto::getSessionTypeCd));

            result.add(com.bandi.backend.dto.ClanJamListDto.builder()
                    .id(group.getBnNo())
                    .title(group.getBnNm())
                    .songTitle(group.getBnSongNm())
                    .artist(group.getBnSingerNm())
                    .description(group.getBnDesc())
                    .isSecret("Y".equals(group.getBnPasswdFg()))
                    .isMember(isMember)
                    .isConfirmed("Y".equals(group.getBnConfFg()))
                    .status(group.getBnConfFg())
                    .roles(roleDtos)
                    .isFull(isFull)
                    .build());
        }

        // Apply Filter (Part)
        if (filterPart != null && !filterPart.isEmpty()) {
            result = result.stream()
                    .filter(dto -> dto.getRoles().stream()
                            .anyMatch(role -> role.getSessionTypeCd().equals(filterPart)
                                    && "empty".equals(role.getStatus())))
                    .collect(java.util.stream.Collectors.toList());
        }

        // Apply Sort
        if ("emptyAsc".equals(sort)) {
            result.sort(java.util.Comparator.comparingLong(dto -> dto.getRoles().stream()
                    .filter(r -> "empty".equals(r.getStatus())).count()));
        } else if ("emptyDesc".equals(sort)) {
            result.sort((a, b) -> Long.compare(
                    b.getRoles().stream().filter(r -> "empty".equals(r.getStatus())).count(),
                    a.getRoles().stream().filter(r -> "empty".equals(r.getStatus())).count()));
        } else {
            // "latest" or default
            result.sort((a, b) -> Long.compare(b.getId(), a.getId()));
        }

        return result;
    }

    @Transactional
    public void joinBand(com.bandi.backend.dto.BandJoinDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String currentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        BnGroup group = bnGroupRepository.findById(dto.getBnNo())
                .orElseThrow(() -> new RuntimeException("Band not found"));

        if ("Y".equals(group.getBnConfFg())) {
            throw new RuntimeException("확정된 합주는 변경할 수 없습니다.");
        }

        // 0. Check for duplicate join - REMOVED to allow multi-session
        // boolean alreadyJoined = bnSessionRepository.findAll().stream()
        // .anyMatch(s -> s.getBnNo().equals(dto.getBnNo()) &&
        // dto.getUserId().equals(s.getBnSessionJoinUserId()));

        // if (alreadyJoined) {
        // throw new RuntimeException("이미 이 합주에 참여 중입니다.");
        // }

        // 1. Insert BN_USER
        BnUser user = new BnUser();
        user.setBnNo(dto.getBnNo());
        user.setBnUserId(dto.getUserId());
        user.setBnRoleCd("NORL");
        user.setBnJoinDate(currentDate);
        user.setBnUserStatCd("A");
        user.setInsDtime(currentDateTime);
        user.setInsId(dto.getUserId());
        user.setUpdDtime(currentDateTime);
        user.setUpdId(dto.getUserId());

        bnUserRepository.save(user);

        // 2. Update BN_SESSION
        // Filter by Session No directly if provided, or by Type + BnNo
        BnSession session = null;
        if (dto.getSessionNo() != null) {
            session = bnSessionRepository.findById(dto.getSessionNo()).orElse(null);
        } else {
            // Fallback if sessionNo not provided (though it should be)
            java.util.List<BnSession> sessions = bnSessionRepository.findAll();
            for (BnSession s : sessions) {
                if (s.getBnNo().equals(dto.getBnNo()) && s.getBnSessionTypeCd().equals(dto.getSessionTypeCd())) {
                    session = s;
                    break;
                }
            }
        }

        if (session != null) {
            session.setBnSessionJoinUserId(dto.getUserId());
            session.setUpdDtime(currentDateTime);
            session.setUpdId(dto.getUserId());
            bnSessionRepository.save(session);
        } else {
            throw new RuntimeException("Session not found");
        }

        updateBandLeader(dto.getBnNo());
    }

    @Transactional
    public void cancelBand(com.bandi.backend.dto.BandJoinDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        BnGroup group = bnGroupRepository.findById(dto.getBnNo())
                .orElseThrow(() -> new RuntimeException("Band not found"));

        if ("Y".equals(group.getBnConfFg())) {
            throw new RuntimeException("확정된 합주는 변경할 수 없습니다.");
        }

        // 1. Update BN_SESSION (Cancel the specific session)
        BnSession session = null;
        if (dto.getSessionNo() != null) {
            session = bnSessionRepository.findById(dto.getSessionNo()).orElse(null);
        } else {
            java.util.List<BnSession> sessions = bnSessionRepository.findAll();
            for (BnSession s : sessions) {
                if (s.getBnNo().equals(dto.getBnNo()) && s.getBnSessionTypeCd().equals(dto.getSessionTypeCd())) {
                    session = s;
                    break;
                }
            }
        }

        if (session != null) {
            if (dto.getUserId().equals(session.getBnSessionJoinUserId())) {
                session.setBnSessionJoinUserId(null);
                session.setUpdDtime(currentDateTime);
                session.setUpdId(dto.getUserId());
                bnSessionRepository.save(session);
            }
        }

        // 2. Check if user is still in ANY other session of this band
        boolean stillInStats = bnSessionRepository.findAll().stream()
                .anyMatch(s -> s.getBnNo().equals(dto.getBnNo()) &&
                        dto.getUserId().equals(s.getBnSessionJoinUserId()));

        // 3. Delete BN_USER only if NOT in any session
        if (!stillInStats) {
            com.bandi.backend.entity.band.BnUserId bnUserId = new com.bandi.backend.entity.band.BnUserId(dto.getBnNo(),
                    dto.getUserId());
            bnUserRepository.deleteById(bnUserId);
        }

        updateBandLeader(dto.getBnNo());
    }

    // Helper methods (Placeholder for actual DB calls or injected services)
    // We need to inject repositories for these or use EntityManager
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    // Quick helpers using EM to avoid circular dependencies or clutter
    private String getSessionName(String code) {
        if (code == null)
            return "Unknown";
        try {
            String sql = "SELECT COMM_DETAIL_NM FROM CM_COMM_DETAIL WHERE COMM_CD = 'BD100' AND COMM_DETAIL_CD = :code";
            return (String) entityManager.createNativeQuery(sql)
                    .setParameter("code", code)
                    .getSingleResult();
        } catch (Exception e) {
            log.error("Error getting session name for code: {}", code, e);
            return code; // Fallback
        }
    }

    private String getUserNickname(String userId) {
        if (userId == null)
            return null;
        try {
            String sql = "SELECT user_nick_nm FROM mm_user WHERE user_id = :userId";
            return (String) entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();
        } catch (Exception e) {
            return "Unknown";
        }
    }

    private java.util.Map<String, Integer> getSessionOrderMap() {
        try {
            String sql = "SELECT COMM_DETAIL_CD, COMM_ORDER FROM CM_COMM_DETAIL WHERE COMM_CD = 'BD100'";
            java.util.List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();

            java.util.Map<String, Integer> orderMap = new java.util.HashMap<>();
            for (Object[] row : results) {
                String code = (String) row[0];
                Integer order = ((Number) row[1]).intValue();
                orderMap.put(code, order);
            }
            return orderMap;
        } catch (Exception e) {
            log.error("Error fetching session order map", e);
            return new java.util.HashMap<>();
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.ClanJamListDto> getRecentNonFullBands(Long clanId, int limit,
            String userId) {
        java.util.List<com.bandi.backend.dto.ClanJamListDto> allBands = getClanBandList(clanId, userId, null, "latest",
                null);

        return allBands.stream()
                .filter(band -> !band.isFull())
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BandDetailDto getBandDetail(Long bnNo, String userId) {
        // 1. (Check removed)

        // 2. Fetch Group Info
        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        // 3. Fetch Sessions
        java.util.List<BnSession> sessions = bnSessionRepository.findAll().stream()
                .filter(s -> s.getBnNo().equals(bnNo))
                .collect(java.util.stream.Collectors.toList());

        // Fetch BnUsers to identify roles (LEAD)
        java.util.List<BnUser> bandMembers = bnUserRepository.findByBnNo(bnNo);
        java.util.Map<String, String> userRoleMap = bandMembers.stream()
                .collect(java.util.stream.Collectors.toMap(BnUser::getBnUserId, BnUser::getBnRoleCd));

        java.util.Map<String, Integer> sessionOrderMap = getSessionOrderMap();
        java.util.List<com.bandi.backend.dto.ClanJamListDto.JamRoleDto> roleDtos = new java.util.ArrayList<>();

        for (BnSession session : sessions) {
            String sessionName = getSessionName(session.getBnSessionTypeCd());
            String userNick = null;
            String status = "empty";
            boolean isCurrentUser = false;
            boolean isRoleBandLeader = false;

            if (session.getBnSessionJoinUserId() != null) {
                userNick = getUserNickname(session.getBnSessionJoinUserId());
                status = "occupied";
                if (session.getBnSessionJoinUserId().equals(userId)) {
                    isCurrentUser = true;
                }

                String roleCd = userRoleMap.get(session.getBnSessionJoinUserId());
                if ("LEAD".equals(roleCd)) {
                    isRoleBandLeader = true;
                }
            }

            roleDtos.add(com.bandi.backend.dto.ClanJamListDto.JamRoleDto.builder()
                    .sessionNo(session.getBnSessionNo())
                    .sessionTypeCd(session.getBnSessionTypeCd())
                    .part(sessionName)
                    .user(userNick)
                    .status(status)
                    .isCurrentUser(isCurrentUser)
                    .isCurrentUser(isCurrentUser)
                    .isBandLeader(isRoleBandLeader)
                    .reservedCount(0)
                    .userId(session.getBnSessionJoinUserId())
                    .build());
        }

        // Sort roles
        roleDtos.sort(java.util.Comparator.comparingInt(
                (com.bandi.backend.dto.ClanJamListDto.JamRoleDto role) -> sessionOrderMap.getOrDefault(
                        role.getSessionTypeCd(), 999))
                .thenComparing(com.bandi.backend.dto.ClanJamListDto.JamRoleDto::getSessionTypeCd));

        // 4. Calculate Permissions
        boolean isBandLeader = group.getBnLeaderId().equals(userId);
        boolean canManage = isBandLeader;

        if (!canManage && "CLAN".equals(group.getBnType()) && group.getCnNo() != null) {
            // Check Clan Role
            com.bandi.backend.entity.clan.ClanUserId clanUserId = new com.bandi.backend.entity.clan.ClanUserId(
                    group.getCnNo(), userId);
            com.bandi.backend.entity.clan.ClanUser clanUser = clanUserRepository.findById(clanUserId).orElse(null);

            if (clanUser != null) {
                String role = clanUser.getCnUserRoleCd();
                if ("01".equals(role) || "02".equals(role)) { // 01: Host, 02: Executive
                    canManage = true;
                }
            }
        }

        String imgUrl = null;
        if (group.getAttachNo() != null) {
            com.bandi.backend.entity.common.CmAttachment attachment = cmAttachmentRepository
                    .findById(group.getAttachNo()).orElse(null);
            if (attachment != null) {
                imgUrl = attachment.getFilePath();
            }
        }

        return BandDetailDto.builder()
                .id(group.getBnNo())
                .title(group.getBnNm())
                .songTitle(group.getBnSongNm())
                .artist(group.getBnSingerNm())
                .description(group.getBnDesc())
                .isSecret("Y".equals(group.getBnPasswdFg()))
                .isLeader(isBandLeader)
                .isConfirmed("Y".equals(group.getBnConfFg()))
                .canManage(canManage)
                .status(group.getBnConfFg())
                .imgUrl(imgUrl)
                .roles(roleDtos)
                .build();
    }

    @Transactional
    public void deleteBand(Long bnNo, String userId) {
        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        // Permission Check (Same logic as canManage usually, but minimal verification
        // here)
        // Ideally should reuse logic or check strictly. For now check Leader.
        // But for Clan Executives, we need to check again.
        boolean isBandLeader = group.getBnLeaderId().equals(userId);
        boolean hasPermission = isBandLeader;

        if (!hasPermission && "CLAN".equals(group.getBnType()) && group.getCnNo() != null) {
            com.bandi.backend.entity.clan.ClanUserId clanUserId = new com.bandi.backend.entity.clan.ClanUserId(
                    group.getCnNo(), userId);
            com.bandi.backend.entity.clan.ClanUser clanUser = clanUserRepository.findById(clanUserId).orElse(null);
            if (clanUser != null) {
                String role = clanUser.getCnUserRoleCd();
                if ("01".equals(role) || "02".equals(role)) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            throw new RuntimeException("No permission to delete this band");
        }

        // Soft Delete or Hard Delete? Requirements said "Delete", usually soft delete
        // 'D' stat
        // But checking createBand, it sets 'A'. Let's set to 'D'.
        group.setBnStatCd("D");
        group.setBnConfFg("D");
        group.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        group.setUpdId(userId);
        bnGroupRepository.save(group);
    }

    private final com.bandi.backend.repository.BnEvaluationResultRepository bnEvaluationResultRepository;
    private final com.bandi.backend.repository.BnEvaluationRepository bnEvaluationRepository;

    @Transactional(readOnly = true)
    public com.bandi.backend.dto.PendingEvaluationDto getPendingEvaluation(String userId) {
        // 1. Find ANY pending evaluation for this user
        // We can use the BnEvaluationRepository. But wait, it's a composite key entity.
        // We need a query method in repository to find by UserId and EvalYn='N'
        // Let's add that to repository first. Or use EntityManager here for quick
        // prototyping.
        // Given complexity, let's use EntityManager for the dynamic check.

        String sql = "SELECT BN_NO FROM BN_EVALUATION WHERE BN_EVAL_USER_ID = :userId AND BN_EVAL_YN = 'N' ORDER BY INS_DTIME ASC LIMIT 1";
        try {
            Long bnNo = (Long) entityManager.createNativeQuery(sql)
                    .setParameter("userId", userId)
                    .getSingleResult();

            if (bnNo != null) {
                // Fetch Band Info
                BnGroup group = bnGroupRepository.findById(bnNo).orElseThrow();

                // Fetch Targets (Participants of the session, excluding self)
                java.util.List<BnSession> sessions = bnSessionRepository.findAll().stream()
                        .filter(s -> s.getBnNo().equals(bnNo) && s.getBnSessionJoinUserId() != null
                                && !s.getBnSessionJoinUserId().equals(userId))
                        .collect(java.util.stream.Collectors.toList());

                java.util.List<com.bandi.backend.dto.PendingEvaluationDto.EvaluationTargetDto> targets = sessions
                        .stream()
                        .map(s -> {
                            String targetUserId = s.getBnSessionJoinUserId();
                            String nick = getUserNickname(targetUserId);
                            String part = getSessionName(s.getBnSessionTypeCd());
                            return new com.bandi.backend.dto.PendingEvaluationDto.EvaluationTargetDto(targetUserId,
                                    nick,
                                    part);
                        })
                        .collect(java.util.stream.Collectors.toList());

                return com.bandi.backend.dto.PendingEvaluationDto.builder()
                        .bnNo(bnNo)
                        .title(group.getBnNm())
                        .songTitle(group.getBnSongNm())
                        .artist(group.getBnSingerNm())
                        .targets(targets)
                        .build();
            }
        } catch (jakarta.persistence.NoResultException e) {
            return null; // No pending evaluation
        } catch (Exception e) {
            log.error("Error checking pending evaluation", e);
        }
        return null;
    }

    @Transactional
    public void createTestEvaluation(String userId) {
        Long bnNo = 1L; // Assuming ID 1 exists. If not, it might fail foreign key check if enforced.
        // Let's check for ANY band.
        java.util.List<BnGroup> groups = bnGroupRepository.findAll();
        if (!groups.isEmpty()) {
            bnNo = groups.get(0).getBnNo();
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        com.bandi.backend.entity.band.BnEvaluation eval = new com.bandi.backend.entity.band.BnEvaluation();
        eval.setBnNo(bnNo);
        eval.setBnEvalUserId(userId);
        eval.setBnEvalYn("N");
        eval.setInsDtime(currentDateTime);
        eval.setInsId(userId);
        eval.setUpdDtime(currentDateTime);
        eval.setUpdId(userId);

        bnEvaluationRepository.save(eval);
    }

    @Transactional
    public void submitEvaluation(com.bandi.backend.dto.EvaluationSubmissionDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String userId = dto.getUserId();
        Long bnNo = dto.getBnNo();

        // 1. Save Results
        for (com.bandi.backend.dto.EvaluationSubmissionDto.EvaluationResultDto result : dto.getResults()) {
            com.bandi.backend.entity.band.BnEvaluationResult entity = new com.bandi.backend.entity.band.BnEvaluationResult();
            entity.setBnNo(bnNo);
            entity.setBnEvalUserId(userId);
            entity.setBnSessionJoinUserId(result.getTargetUserId());
            entity.setBnEvalScore(result.getScore());
            entity.setBnMoodMakerFg(result.isMoodMaker() ? "Y" : "N");
            entity.setInsDtime(currentDateTime);
            entity.setInsId(userId);
            entity.setUpdDtime(currentDateTime);
            entity.setUpdId(userId);
            bnEvaluationResultRepository.save(entity);
        }

        // 2. Update Status in BN_EVALUATION
        com.bandi.backend.entity.band.BnEvaluationId id = new com.bandi.backend.entity.band.BnEvaluationId(bnNo,
                userId);
        com.bandi.backend.entity.band.BnEvaluation evaluation = bnEvaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluation record not found"));
        evaluation.setBnEvalYn("Y");
        evaluation.setUpdDtime(currentDateTime);
        evaluation.setUpdId(userId);
        bnEvaluationRepository.save(evaluation);
    }

    @Transactional
    public void updateBandStatus(Long bnNo, String userId, String status) {
        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        // Permission Check
        boolean isBandLeader = group.getBnLeaderId().equals(userId);
        boolean hasPermission = isBandLeader;

        if (!hasPermission && "CLAN".equals(group.getBnType()) && group.getCnNo() != null) {
            com.bandi.backend.entity.clan.ClanUserId clanUserId = new com.bandi.backend.entity.clan.ClanUserId(
                    group.getCnNo(), userId);
            com.bandi.backend.entity.clan.ClanUser clanUser = clanUserRepository.findById(clanUserId).orElse(null);
            if (clanUser != null) {
                String role = clanUser.getCnUserRoleCd();
                if ("01".equals(role) || "02".equals(role)) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            throw new RuntimeException("No permission to update band status");
        }

        if ("Y".equals(status)) {
            boolean isFull = bnSessionRepository.findAll().stream()
                    .filter(s -> s.getBnNo().equals(bnNo))
                    .allMatch(s -> s.getBnSessionJoinUserId() != null);

            if (!isFull) {
                throw new RuntimeException("모든 세션이 참여되어야 확정할 수 있습니다.");
            }
        }

        // Handle End Jam Logic (Status 'E')
        if ("E".equals(status)) {
            String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            // Insert evaluation targets
            bnEvaluationRepository.insertEvaluationsFromSession(bnNo, currentDateTime, userId);
        }

        group.setBnConfFg(status);
        if ("E".equals(status)) {
            group.setBnStatCd("E");
        }

        group.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        group.setUpdId(userId);
        bnGroupRepository.save(group);
    }

    @Transactional(readOnly = true)
    public boolean verifyBandPassword(Long bnNo, String password) {
        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        if (!"Y".equals(group.getBnPasswdFg())) {
            return true; // No password needed
        }

        return password != null && password.equals(group.getBnPasswd());
    }

    @Transactional
    public void updateBand(Long bnNo, com.bandi.backend.dto.BandUpdateDto dto) {
        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        // Permission Check
        boolean hasPermission = false;
        if (group.getBnLeaderId().equals(dto.getUserId())) {
            hasPermission = true;
        }

        if (!hasPermission && "CLAN".equals(group.getBnType()) && group.getCnNo() != null) {
            com.bandi.backend.entity.clan.ClanUserId clanUserId = new com.bandi.backend.entity.clan.ClanUserId(
                    group.getCnNo(), dto.getUserId());
            com.bandi.backend.entity.clan.ClanUser clanUser = clanUserRepository.findById(clanUserId).orElse(null);
            if (clanUser != null) {
                String role = clanUser.getCnUserRoleCd();
                if ("01".equals(role) || "02".equals(role)) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        // Update fields
        if (dto.getDescription() != null) {
            group.setBnDesc(dto.getDescription());
        }

        if (dto.getAttachNo() != null) {
            group.setAttachNo(dto.getAttachNo());
        }

        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        group.setUpdDtime(currentDateTime);
        group.setUpdId(dto.getUserId());

        bnGroupRepository.save(group);
    }

    @Transactional
    public void kickBandMember(java.util.Map<String, Object> params) {
        Long bnNo = Long.valueOf(params.get("bnNo").toString());
        String requesterId = (String) params.get("requesterId");
        String targetUserId = (String) params.get("targetUserId");
        Integer sessionNo = params.get("sessionNo") != null ? Integer.valueOf(params.get("sessionNo").toString())
                : null;
        String sessionTypeCd = (String) params.get("sessionTypeCd");

        BnGroup group = bnGroupRepository.findById(bnNo)
                .orElseThrow(() -> new RuntimeException("Band not found"));

        // 1. Permission Check (Requester must be Band Leader OR Clan Leader/Executive)
        boolean hasPermission = false;

        // Check Band Leader
        if (group.getBnLeaderId().equals(requesterId)) {
            hasPermission = true;
        }

        // Check Clan Role
        if (!hasPermission && "CLAN".equals(group.getBnType()) && group.getCnNo() != null) {
            com.bandi.backend.entity.clan.ClanUserId clanUserId = new com.bandi.backend.entity.clan.ClanUserId(
                    group.getCnNo(), requesterId);
            com.bandi.backend.entity.clan.ClanUser clanUser = clanUserRepository.findById(clanUserId).orElse(null);

            if (clanUser != null) {
                String role = clanUser.getCnUserRoleCd();
                if ("01".equals(role) || "02".equals(role)) {
                    hasPermission = true;
                }
            }
        }

        if (!hasPermission) {
            throw new RuntimeException("강제 퇴장 권한이 없습니다.");
        }

        // 2. Perform Kick (Same logic as cancelBand, but for targetUserId)
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // Update BN_SESSION
        BnSession session = null;
        if (sessionNo != null) {
            session = bnSessionRepository.findById(Long.valueOf(sessionNo)).orElse(null);
        } else {
            java.util.List<BnSession> sessions = bnSessionRepository.findAll();
            for (BnSession s : sessions) {
                if (s.getBnNo().equals(bnNo) && s.getBnSessionTypeCd().equals(sessionTypeCd)) {
                    session = s;
                    break;
                }
            }
        }

        if (session != null) {
            // Only kick if the target user is actually in this session
            if (targetUserId.equals(session.getBnSessionJoinUserId())) {
                session.setBnSessionJoinUserId(null);
                session.setUpdDtime(currentDateTime);
                session.setUpdId(requesterId);
                bnSessionRepository.save(session);
            }
        }

        // 3. Check if target user is still in ANY other session
        boolean stillInStats = bnSessionRepository.findAll().stream()
                .anyMatch(s -> s.getBnNo().equals(bnNo) &&
                        targetUserId.equals(s.getBnSessionJoinUserId()));

        // 4. Delete BN_USER only if NOT in any session
        if (!stillInStats) {
            com.bandi.backend.entity.band.BnUserId bnUserId = new com.bandi.backend.entity.band.BnUserId(bnNo,
                    targetUserId);
            if (bnUserRepository.existsById(bnUserId)) {
                bnUserRepository.deleteById(bnUserId);
            }
        }

        updateBandLeader(bnNo);
    }

    private void updateBandLeader(Long bnNo) {
        // 1. Get all occupied sessions for this band
        java.util.List<BnSession> sessions = bnSessionRepository.findAll().stream()
                .filter(s -> s.getBnNo().equals(bnNo) && s.getBnSessionJoinUserId() != null)
                .collect(java.util.stream.Collectors.toList());

        if (sessions.isEmpty()) {
            return; // No members left
        }

        // 2. Get Priority Map (COMM_ORDER)
        java.util.Map<String, Integer> orderMap = getSessionOrderMap();

        // 3. Sort by Order ASC, then by Update Time (First come first serve)
        sessions.sort((s1, s2) -> {
            int order1 = orderMap.getOrDefault(s1.getBnSessionTypeCd(), 999);
            int order2 = orderMap.getOrDefault(s2.getBnSessionTypeCd(), 999);
            if (order1 != order2) {
                return Integer.compare(order1, order2);
            }
            return s1.getUpdDtime().compareTo(s2.getUpdDtime());
        });

        // 4. Determine New Leader
        String newLeaderId = sessions.get(0).getBnSessionJoinUserId();

        // 5. Update BN_GROUP
        BnGroup group = bnGroupRepository.findById(bnNo).orElseThrow();
        if (!newLeaderId.equals(group.getBnLeaderId())) {
            group.setBnLeaderId(newLeaderId);
            group.setUpdDtime(java.time.LocalDateTime.now()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            group.setUpdId("SYSTEM"); // Or some system ID
            bnGroupRepository.save(group);
        }

        // 6. Update BN_USER Roles
        java.util.List<BnUser> users = bnUserRepository.findByBnNo(bnNo);
        for (BnUser user : users) {
            String newRole = user.getBnUserId().equals(newLeaderId) ? "LEAD" : "NORL";
            if (!newRole.equals(user.getBnRoleCd())) {
                user.setBnRoleCd(newRole);
                user.setUpdDtime(java.time.LocalDateTime.now()
                        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
                user.setUpdId("SYSTEM");
                bnUserRepository.save(user);
            }
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.repository.projection.MyJamProjection> getMyJams(String userId) {
        return bnGroupRepository.findMyJams(userId);
    }

    // --- Jam Schedule Methods ---

    private final com.bandi.backend.repository.BnPlanScheduleRepository bnPlanScheduleRepository;
    private final com.bandi.backend.repository.BnPlanScheduleLikeRepository bnPlanScheduleLikeRepository;
    private final com.bandi.backend.repository.BnPlanScheduleTimeRepository bnPlanScheduleTimeRepository;

    @Transactional
    public void createSchedule(com.bandi.backend.dto.BandScheduleDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String bnSchDate = dto.getStartDate();
        String userId = dto.getUserId();
        Long bnNo = dto.getBnNo();

        // 1. Save BN_PLAN_SCHEDULE
        com.bandi.backend.entity.band.BnPlanSchedule planSchedule = new com.bandi.backend.entity.band.BnPlanSchedule();
        planSchedule.setBnNo(bnNo);
        planSchedule.setBnSchDate(bnSchDate);
        planSchedule.setInsDtime(currentDateTime);
        planSchedule.setInsId(userId);
        planSchedule.setUpdDtime(currentDateTime);
        planSchedule.setUpdId(userId);
        bnPlanScheduleRepository.save(planSchedule);

        // 2. Save BN_PLAN_SCHEDULE_LIKE
        com.bandi.backend.entity.band.BnPlanScheduleLike planLike = new com.bandi.backend.entity.band.BnPlanScheduleLike();
        planLike.setBnNo(bnNo);
        planLike.setBnSchDate(bnSchDate);
        planLike.setBnUserId(userId);
        planLike.setInsDtime(currentDateTime);
        planLike.setInsId(userId);
        planLike.setUpdDtime(currentDateTime);
        planLike.setUpdId(userId);
        bnPlanScheduleLikeRepository.save(planLike);

        // 3. Save BN_PLAN_SCHEDULE_TIME (Loop hours)
        // DTO start/end are "HH0000" / "HH5900" (6 chars)
        int startHour = Integer.parseInt(dto.getStartTime().substring(0, 2));
        int endHour = Integer.parseInt(dto.getEndTime().substring(0, 2));

        for (int hour = startHour; hour <= endHour; hour++) {
            String timeStr = String.format("%02d00", hour); // "HH00" format as per spec

            com.bandi.backend.entity.band.BnPlanScheduleTime planTime = new com.bandi.backend.entity.band.BnPlanScheduleTime();
            planTime.setBnNo(bnNo);
            planTime.setBnSchDate(bnSchDate);
            planTime.setBnUserId(userId);
            planTime.setBnSchTime(timeStr);
            planTime.setInsDtime(currentDateTime);
            planTime.setInsId(userId);
            planTime.setUpdDtime(currentDateTime);
            planTime.setUpdId(userId);

            bnPlanScheduleTimeRepository.save(planTime);
        }
    }

    @Transactional
    public void deleteSchedule(Long bnNo, String userId, String date) {
        // 1. Delete TIME records
        java.util.List<com.bandi.backend.entity.band.BnPlanScheduleTime> times = bnPlanScheduleTimeRepository
                .findByBnNo(bnNo);
        for (com.bandi.backend.entity.band.BnPlanScheduleTime t : times) {
            if (t.getBnUserId().equals(userId) && t.getBnSchDate().equals(date)) {
                bnPlanScheduleTimeRepository.delete(t);
            }
        }

        // 2. Delete LIKE record
        com.bandi.backend.entity.band.BnPlanScheduleLikeId likeId = new com.bandi.backend.entity.band.BnPlanScheduleLikeId(
                bnNo, date, userId);
        if (bnPlanScheduleLikeRepository.existsById(likeId)) {
            bnPlanScheduleLikeRepository.deleteById(likeId);
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<com.bandi.backend.dto.BandScheduleDto> getSchedules(Long bnNo) {
        java.util.List<com.bandi.backend.entity.band.BnPlanScheduleTime> times = bnPlanScheduleTimeRepository
                .findByBnNo(bnNo);

        return times.stream()
                .map(t -> {
                    // Convert "HH00" to "HH0000" / "HH5900" for frontend compatibility
                    String hourStr = t.getBnSchTime().substring(0, 2);
                    String startStr = hourStr + "0000";
                    String endStr = hourStr + "5900"; // Or "6000" if exclusive? Frontend handles inclusive logic.
                    // Use 5900 to match insertion logic style essentially covering that hour.

                    return com.bandi.backend.dto.BandScheduleDto.builder()
                            .bnSchNo(0L) // No single ID anymore
                            .bnNo(t.getBnNo())
                            .title("합주조율")
                            .content("합주내용")
                            .startDate(t.getBnSchDate())
                            .startTime(startStr)
                            .endDate(t.getBnSchDate()) // Assume same date for now
                            .endTime(endStr)
                            .allDayYn("P")
                            .userId(t.getBnUserId())
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
