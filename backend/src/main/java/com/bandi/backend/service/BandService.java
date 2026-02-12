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

                    // Search Filter
                    if (keyword != null && !keyword.isEmpty()) {
                        if (g.getBnNm() == null || !g.getBnNm().contains(keyword)) {
                            return false;
                        }
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

        // 0. Check for duplicate join
        // 0. Check for duplicate join
        boolean alreadyJoined = bnSessionRepository.findAll().stream()
                .anyMatch(s -> s.getBnNo().equals(dto.getBnNo()) &&
                        dto.getUserId().equals(s.getBnSessionJoinUserId()));

        if (alreadyJoined) {
            throw new RuntimeException("이미 이 합주에 참여 중입니다.");
        }

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
    }

    @Transactional
    public void cancelBand(com.bandi.backend.dto.BandJoinDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        BnGroup group = bnGroupRepository.findById(dto.getBnNo())
                .orElseThrow(() -> new RuntimeException("Band not found"));

        if ("Y".equals(group.getBnConfFg())) {
            throw new RuntimeException("확정된 합주는 변경할 수 없습니다.");
        }

        // 1. Delete BN_USER
        com.bandi.backend.entity.band.BnUserId bnUserId = new com.bandi.backend.entity.band.BnUserId(dto.getBnNo(),
                dto.getUserId());
        bnUserRepository.deleteById(bnUserId);

        // 2. Update BN_SESSION
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
        // 1. Check if user is a member of the band
        com.bandi.backend.entity.band.BnUserId bnUserId = new com.bandi.backend.entity.band.BnUserId(bnNo, userId);
        boolean isMember = bnUserRepository.existsById(bnUserId);

        if (!isMember) {
            throw new RuntimeException("해당 합주방의 멤버가 아닙니다.");
        }

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
                    .isBandLeader(isRoleBandLeader)
                    .reservedCount(0)
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

    @Transactional
    public void updateBandStatus(Long bnNo, String userId, String status) { // status: 'Y' or 'N'
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

        group.setBnConfFg(status);
        group.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        group.setUpdId(userId);
        bnGroupRepository.save(group);
    }
}
