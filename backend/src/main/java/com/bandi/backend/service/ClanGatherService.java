package com.bandi.backend.service;

import com.bandi.backend.dto.*;
import com.bandi.backend.entity.clan.*;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.bandi.backend.entity.common.CommDetail;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClanGatherService {

    private final ClanGatherRepository clanGatherRepository;
    private final ClanGatherWeightRepository clanGatherWeightRepository;
    private final ClanGatherApplyRepository clanGatherApplyRepository;
    private final ClanUserRepository clanUserRepository;
    private final UserRepository userRepository;
    private final UserSessionSkillRepository userSessionSkillRepository;
    private final CommDetailRepository commDetailRepository;
    private final ClanGatherSessionRepository clanGatherSessionRepository;
    private final ClanMatchRoomRepository clanMatchRoomRepository;
    private final ClanMatchResultRepository clanMatchResultRepository;
    private final BnGroupRepository bnGroupRepository;
    private final BnUserRepository bnUserRepository;
    private final BnSessionRepository bnSessionRepository;
    private final BandChatRoomRepository bandChatRoomRepository;

    @Transactional
    public Long createGathering(ClanGatherCreateDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = currentDateTime.substring(0, 8);

        // 1. Check if user is Clan Leader
        String role = clanUserRepository.findById(new ClanUserId(dto.getCnNo(), dto.getUserId()))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        if (!"01".equals(role)) {
            throw new RuntimeException("Only clan leaders can create gathering notices.");
        }

        // 2. Create Gather notice
        ClanGather gather = new ClanGather();
        gather.setCnNo(dto.getCnNo());
        gather.setTitle(dto.getTitle());
        gather.setGatherDate(dto.getGatherDate());
        gather.setRoomCnt(dto.getRoomCnt());
        gather.setRegDate(todayDate);
        gather.setGatherStatCd("A"); // Active/Approved
        gather.setGatherProcFg("N"); // N: Recruiting (모집중)
        gather.setInsDtime(currentDateTime);
        gather.setInsId(dto.getUserId());
        gather.setUpdDtime(currentDateTime);
        gather.setUpdId(dto.getUserId());

        ClanGather savedGather = clanGatherRepository.save(gather);

        // 3. Create Weights
        if (dto.getWeights() != null) {
            for (ClanGatherWeightDto weightDto : dto.getWeights()) {
                ClanGatherWeight weight = new ClanGatherWeight();
                weight.setGatherNo(savedGather.getGatherNo());
                weight.setGatherTypeCd(weightDto.getGatherTypeCd());
                weight.setWeightValue(weightDto.getWeightValue());
                weight.setBalanceApplyYn(weightDto.getBalanceApplyYn());
                weight.setInsDtime(currentDateTime);
                weight.setInsId(dto.getUserId());
                weight.setUpdDtime(currentDateTime);
                weight.setUpdId(dto.getUserId());
                clanGatherWeightRepository.save(weight);
            }
        }

        // 4. 세션 목록 저장
        if (dto.getSessionTypeCds() != null && !dto.getSessionTypeCds().isEmpty()) {
            for (String sessionCd : dto.getSessionTypeCds()) {
                ClanGatherSession session = new ClanGatherSession();
                session.setGatherNo(savedGather.getGatherNo());
                session.setSessionTypeCd(sessionCd);
                session.setInsDtime(currentDateTime);
                session.setInsId(dto.getUserId());
                session.setUpdDtime(currentDateTime);
                session.setUpdId(dto.getUserId());
                clanGatherSessionRepository.save(session);
            }
        }

        return savedGather.getGatherNo();
    }

    @Transactional
    public void applyForGathering(ClanGatherApplyDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // Check if already applied
        clanGatherApplyRepository.findByGatherNoAndUserId(dto.getGatherNo(), dto.getUserId())
                .ifPresent(a -> {
                    throw new RuntimeException("Already applied for this gathering.");
                });

        // 1. Fetch User Profile Info (MBTI, Gender)
        User user = userRepository.findByUserId(dto.getUserId());

        // 2. Lookup Session Skill Scores
        Integer score1st = getSkillScore(dto.getUserId(), dto.getSessionTypeCd1st());
        Integer score2nd = getSkillScore(dto.getUserId(), dto.getSessionTypeCd2nd());

        ClanGatherApply apply = new ClanGatherApply();
        apply.setGatherNo(dto.getGatherNo());
        apply.setUserId(dto.getUserId());
        apply.setSessionTypeCd1st(dto.getSessionTypeCd1st());
        apply.setSession1stScore(score1st);
        apply.setSessionTypeCd2nd(dto.getSessionTypeCd2nd());
        apply.setSession2ndScore(score2nd);

        // MBTI and Gender from Profile
        if (user != null) {
            apply.setUserMbti(user.getMbti());
            apply.setUserGenderCd(user.getGenderCd());
        }

        apply.setInsDtime(currentDateTime);
        apply.setInsId(dto.getUserId());
        apply.setUpdDtime(currentDateTime);
        apply.setUpdId(dto.getUserId());

        clanGatherApplyRepository.save(apply);
    }

    @Transactional
    public void cancelApplication(Long gatherNo, String userId) {
        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new RuntimeException("Gather notice not found."));

        if (!"N".equals(gather.getGatherProcFg())) {
            throw new RuntimeException("Applications can only be cancelled while recruiting.");
        }

        clanGatherApplyRepository.deleteByGatherNoAndUserId(gatherNo, userId);
    }

    private Integer getSkillScore(String userId, String sessionTypeCd) {
        if (sessionTypeCd == null || sessionTypeCd.isEmpty())
            return 0;
        return userSessionSkillRepository.findByUserId(userId).stream()
                .filter(s -> s.getSessionTypeCd().equals(sessionTypeCd))
                .findFirst()
                .map(s -> s.getSessionSkillScore().intValue())
                .orElse(1); // Default to 1 if not exists
    }

    @Transactional(readOnly = true)
    public List<ClanGatherResponseDto> getActiveGatherings(Long clanId, String userId) {
        List<ClanGather> gatherings = clanGatherRepository.findByCnNoAndGatherProcFgNot(clanId, "E");
        return convertToResponseDtos(gatherings, userId);
    }

    @Transactional(readOnly = true)
    public List<ClanGatherResponseDto> getAllGatherings(Long clanId, String userId) {
        // Only Leaders (01) and Staff (02) can see all/past gatherings for management
        String role = clanUserRepository.findById(new ClanUserId(clanId, userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");

        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("Access denied. Only clan staff can view management list.");
        }

        List<ClanGather> gatherings = clanGatherRepository.findByCnNo(clanId);
        return convertToResponseDtos(gatherings, userId);
    }

    private List<ClanGatherResponseDto> convertToResponseDtos(List<ClanGather> gatherings, String userId) {
        return gatherings.stream().map(g -> {
            boolean isApplied = userId != null
                    && clanGatherApplyRepository.findByGatherNoAndUserId(g.getGatherNo(), userId).isPresent();

            List<ClanGatherWeightDto> weights = clanGatherWeightRepository.findByGatherNo(g.getGatherNo())
                    .stream().map(w -> {
                        ClanGatherWeightDto wDto = new ClanGatherWeightDto();
                        wDto.setGatherTypeCd(w.getGatherTypeCd());
                        wDto.setWeightValue(w.getWeightValue());
                        wDto.setBalanceApplyYn(w.getBalanceApplyYn());
                        return wDto;
                    }).collect(Collectors.toList());

            List<ClanGatherApply> applicants = clanGatherApplyRepository.findByGatherNo(g.getGatherNo());
            int applicantCnt = applicants.size();
            int maleCnt = (int) applicants.stream().filter(a -> "M".equals(a.getUserGenderCd())).count();
            int femaleCnt = (int) applicants.stream().filter(a -> "F".equals(a.getUserGenderCd())).count();

            return ClanGatherResponseDto.builder()
                    .gatherNo(g.getGatherNo())
                    .cnNo(g.getCnNo())
                    .title(g.getTitle())
                    .gatherDate(g.getGatherDate())
                    .roomCnt(g.getRoomCnt())
                    .gatherStatCd(g.getGatherStatCd())
                    .gatherProcFg(g.getGatherProcFg())
                    .regDate(g.getRegDate())
                    .weights(weights)
                    .isApplied(isApplied)
                    .applicantCnt(applicantCnt)
                    .maleCnt(maleCnt)
                    .femaleCnt(femaleCnt)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void closeGathering(Long gatherNo, String userId) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new RuntimeException("Gathering notice not found."));

        String role = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("Only clan staff can close recruitment.");
        }

        gather.setGatherStatCd("CL"); // CL: Closed (모집종료) - Legacy status
        gather.setGatherProcFg("Y"); // Y: Recruitment Closed (모집종료)
        gather.setUpdDtime(currentDateTime);
        gather.setUpdId(userId);
        clanGatherRepository.save(gather);
    }

    @Transactional
    public void reopenGathering(Long gatherNo, String userId) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new RuntimeException("합주 모집 공고를 찾을 수 없습니다."));

        // 1. 권한 체크
        String role = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜 관리자 또는 운영진만 모집 재개를 할 수 있습니다.");
        }

        // 2. 상태 체크 (매칭 여부 확인)
        String procFg = gather.getGatherProcFg();
        if ("M".equals(procFg)) {
            throw new RuntimeException("이미 매칭이 완료되어 모집을 재개할 수 없습니다.");
        }
        if ("E".equals(procFg)) {
            throw new RuntimeException("이미 종료된 공고입니다.");
        }
        if ("N".equals(procFg)) {
            throw new RuntimeException("이미 모집 중인 공고입니다.");
        }

        // 3. 상태 업데이트 (N: 모집중으로 복구)
        gather.setGatherStatCd("A"); // Active
        gather.setGatherProcFg("N");
        gather.setUpdDtime(currentDateTime);
        gather.setUpdId(userId);

        clanGatherRepository.save(gather);
    }

    @Transactional(readOnly = true)
    public List<ClanGatherApplicantDto> getApplicants(Long gatherNo) {
        List<ClanGatherApply> applies = clanGatherApplyRepository.findByGatherNo(gatherNo);

        // Fetch session names for BD100
        List<com.bandi.backend.entity.common.CommDetail> sessionCodes = commDetailRepository
                .findActiveDetailsByCommCd("BD100");

        return applies.stream().map(a -> {
            User user = userRepository.findByUserId(a.getUserId());
            String nickName = (user != null) ? user.getUserNickNm() : "Unknown";

            String s1Nm = sessionCodes.stream()
                    .filter(c -> c.getCommDtlCd().equals(a.getSessionTypeCd1st()))
                    .findFirst().map(com.bandi.backend.entity.common.CommDetail::getCommDtlNm)
                    .orElse(a.getSessionTypeCd1st());

            String s2Nm = a.getSessionTypeCd2nd() != null ? sessionCodes.stream()
                    .filter(c -> c.getCommDtlCd().equals(a.getSessionTypeCd2nd()))
                    .findFirst().map(com.bandi.backend.entity.common.CommDetail::getCommDtlNm)
                    .orElse(a.getSessionTypeCd2nd()) : null;

            return ClanGatherApplicantDto.builder()
                    .userId(a.getUserId())
                    .userNickNm(nickName)
                    .sessionTypeNm1st(s1Nm)
                    .session1stScore(a.getSession1stScore())
                    .sessionTypeNm2nd(s2Nm)
                    .session2ndScore(a.getSession2ndScore())
                    .mbti(a.getUserMbti())
                    .gender(a.getUserGenderCd())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void performMatching(Long gatherNo, String userId) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new RuntimeException("합주 모집 공고를 찾을 수 없습니다."));

        // 1. 권한 체크
        String role = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");

        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜 관리자 또는 운영진만 매칭을 진행할 수 있습니다.");
        }
        if (!"Y".equals(gather.getGatherProcFg()) && !"M".equals(gather.getGatherProcFg())) {
            throw new RuntimeException("모집종료('Y') 또는 매핑완료('M') 상태인 공고만 매칭을 진행할 수 있습니다.");
        }

        // 2. 설정 정보 및 신청자 로드
        List<ClanGatherWeight> weights = clanGatherWeightRepository.findByGatherNo(gatherNo);
        List<ClanGatherSession> sessions = clanGatherSessionRepository.findByGatherNo(gatherNo);
        log.info("[Match] GatherNo: {}, RoomCnt: {}, Sessions: {}", gatherNo, gather.getRoomCnt(), sessions.size());

        if (sessions.isEmpty()) {
            throw new RuntimeException("모집 세션 정보가 없습니다.");
        }
        Map<String, Long> targetSessionCnts = sessions.stream()
                .collect(Collectors.groupingBy(ClanGatherSession::getSessionTypeCd, Collectors.counting()));

        List<ClanGatherApply> allApplicants = clanGatherApplyRepository.findByGatherNo(gatherNo);
        List<ClanGatherApply> validApplicants = allApplicants.stream()
                .filter(a -> targetSessionCnts.containsKey(a.getSessionTypeCd1st()) ||
                        (a.getSessionTypeCd2nd() != null && targetSessionCnts.containsKey(a.getSessionTypeCd2nd())))
                .collect(Collectors.toList());

        log.info("[Match] AllApplicants: {}, ValidApplicants: {}", allApplicants.size(), validApplicants.size());

        // 실력별 정렬 (고수 -> 초보)
        validApplicants.sort((a, b) -> Integer.compare(b.getSession1stScore(), a.getSession1stScore()));

        // 가중치 토글 정보
        boolean isSkillBalanceOn = weights.stream()
                .filter(w -> w.getGatherTypeCd().equals("SKILL"))
                .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);
        boolean isGenderBalanceOn = weights.stream()
                .filter(w -> w.getGatherTypeCd().equals("GENDER"))
                .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);
        boolean isMbtiBalanceOn = weights.stream()
                .filter(w -> w.getGatherTypeCd().equals("MBTI"))
                .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);

        StringBuilder debugLog = new StringBuilder("=== MATCH DEBUG ===\n");
        debugLog.append("validApplicants: ").append(validApplicants.size()).append("\n");
        for (ClanGatherApply va : validApplicants) {
            debugLog.append("  App: ").append(va.getUserId()).append(" session:").append(va.getSessionTypeCd1st())
                    .append("\n");
        }

        // 3. 방 수 자동 계산 (모든 인원을 수용하기 위해 세션별 최대 필요 수 산출)
        Map<String, Long> appCounts = validApplicants.stream()
                .collect(Collectors.groupingBy(ClanGatherApply::getSessionTypeCd1st, Collectors.counting()));
        long maxRoomsNeeded = 0;
        for (String sCd : targetSessionCnts.keySet()) {
            long requiredPerTeam = targetSessionCnts.get(sCd);
            long apps = appCounts.getOrDefault(sCd, 0L);
            maxRoomsNeeded = Math.max(maxRoomsNeeded, (long) Math.ceil((double) apps / (double) requiredPerTeam));
        }

        int computedRoomCnt = (int) maxRoomsNeeded;

        if (computedRoomCnt <= 0) {
            log.warn("[Match] Not enough applicants to form even one team. validApplicants={}", validApplicants.size());
            throw new RuntimeException("신청 인원이 없어 팀을 구성할 수 없습니다.");
        }

        int teamSize = sessions.size();
        log.info("[Match] computedRoomCnt={} (based on max session demand), validApplicants={}, teamSize={}",
                computedRoomCnt, validApplicants.size(), teamSize);

        class RoomState {
            int totalSkill = 0;
            Map<String, Integer> currentSessionCnt = new HashMap<>(); // assignedSession 기준
            Map<String, Integer> currentGenderCnt = new HashMap<>();
            Map<String, Integer> currentMbtiTypeCnt = new HashMap<>();
            List<ClanGatherApply> members = new ArrayList<>();
            Map<ClanGatherApply, String> assignedSessions = new HashMap<>(); // 유저별 배정된 세션 코드

            int maxSkill = 0; // OFF 모드 실력 그룹화를 위한 최고 레벨 추적

            double getAvgSkill() {
                return members.isEmpty() ? 0 : (double) totalSkill / members.size();
            }

            void add(ClanGatherApply a, String assignedSession) {
                members.add(a);
                assignedSessions.put(a, assignedSession);

                int score = assignedSession.equals(a.getSessionTypeCd1st()) ? a.getSession1stScore()
                        : a.getSession2ndScore();
                totalSkill += score;
                if (score > maxSkill)
                    maxSkill = score;

                currentSessionCnt.put(assignedSession, currentSessionCnt.getOrDefault(assignedSession, 0) + 1);

                if (a.getUserGenderCd() != null)
                    currentGenderCnt.put(a.getUserGenderCd(),
                            currentGenderCnt.getOrDefault(a.getUserGenderCd(), 0) + 1);
                if (a.getUserMbti() != null && a.getUserMbti().length() > 0) {
                    String m = a.getUserMbti().substring(0, 1).toUpperCase();
                    currentMbtiTypeCnt.put(m, currentMbtiTypeCnt.getOrDefault(m, 0) + 1);
                }
            }

            void remove(ClanGatherApply a) {
                String assignedSession = assignedSessions.remove(a);
                if (members.remove(a) && assignedSession != null) {
                    int score = assignedSession.equals(a.getSessionTypeCd1st()) ? a.getSession1stScore()
                            : a.getSession2ndScore();
                    totalSkill -= score;
                    // maxSkill 재계산
                    maxSkill = 0;
                    for (ClanGatherApply m : members) {
                        String s = assignedSessions.get(m);
                        int ms = s.equals(m.getSessionTypeCd1st()) ? m.getSession1stScore() : m.getSession2ndScore();
                        if (ms > maxSkill)
                            maxSkill = ms;
                    }

                    currentSessionCnt.put(assignedSession, currentSessionCnt.getOrDefault(assignedSession, 0) - 1);
                    if (a.getUserGenderCd() != null)
                        currentGenderCnt.put(a.getUserGenderCd(),
                                currentGenderCnt.getOrDefault(a.getUserGenderCd(), 0) - 1);
                    if (a.getUserMbti() != null && a.getUserMbti().length() > 0) {
                        String m = a.getUserMbti().substring(0, 1).toUpperCase();
                        currentMbtiTypeCnt.put(m, currentMbtiTypeCnt.getOrDefault(m, 0) - 1);
                    }
                }
            }
        }

        List<RoomState> rooms = new ArrayList<>();
        for (int i = 0; i < computedRoomCnt; i++)
            rooms.add(new RoomState());

        // 4. [1단계] 초기 배정
        if (isSkillBalanceOn) {
            // [스킬ON] 단일 패스: 실력 총합이 낮은 방에 균등 배분 + 성별/MBTI 가산점
            for (ClanGatherApply app : validApplicants) {
                String sessionCd = app.getSessionTypeCd1st();
                long totalRequiredSessionCnt = targetSessionCnts.getOrDefault(sessionCd, 0L);
                long targetCntPerRoom = (long) Math.ceil((double) totalRequiredSessionCnt / (double) rooms.size());

                RoomState bestRoom = null;
                double maxScore = -Double.MAX_VALUE;

                for (RoomState r : rooms) {
                    // 세션 정원 초과 체크 (ON 모드는 균등 배분이 우선이므로 엄격히 제한)
                    if (r.currentSessionCnt.getOrDefault(sessionCd, 0) >= targetCntPerRoom)
                        continue;

                    double score = 0;
                    double maxTotal = rooms.stream().mapToDouble(rm -> rm.totalSkill).max().orElse(0);
                    score += (maxTotal - r.totalSkill);
                    if (isGenderBalanceOn && app.getUserGenderCd() != null) {
                        int maxGender = rooms.stream()
                                .mapToInt(rm -> rm.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)).max()
                                .orElse(0);
                        score += (maxGender - r.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)) * 25.0;
                    }
                    if (isMbtiBalanceOn && app.getUserMbti() != null && app.getUserMbti().length() > 0) {
                        String m = app.getUserMbti().substring(0, 1).toUpperCase();
                        int maxMbti = rooms.stream().mapToInt(rm -> rm.currentMbtiTypeCnt.getOrDefault(m, 0)).max()
                                .orElse(0);
                        score += (maxMbti - r.currentMbtiTypeCnt.getOrDefault(m, 0)) * 20.0;
                    }
                    if (score > maxScore || bestRoom == null) {
                        maxScore = score;
                        bestRoom = r;
                    }
                }
                // 만약 모든 방이 꽉 찼다면 (나머지 인원) 가장 점수 높은 방에 강제 배정
                if (bestRoom == null) {
                    for (RoomState r : rooms) {
                        double score = 0;
                        double maxTotal = rooms.stream().mapToDouble(rm -> rm.totalSkill).max().orElse(0);
                        score += (maxTotal - r.totalSkill);
                        if (score > maxScore || bestRoom == null) {
                            maxScore = score;
                            bestRoom = r;
                        }
                    }
                }
                if (bestRoom != null)
                    bestRoom.add(app, sessionCd);
            }
        } else {
            // [스킬OFF] 유저 요청: 실력 위주 그룹화 배정 (Clustering)
            Map<String, List<ClanGatherApply>> sessionGroups = validApplicants.stream()
                    .collect(Collectors.groupingBy(ClanGatherApply::getSessionTypeCd1st));

            for (String sCd : sessionGroups.keySet()) {
                List<ClanGatherApply> group = sessionGroups.get(sCd);
                long perTeam = targetSessionCnts.getOrDefault(sCd, 0L);

                int currentAppIdx = 0;
                // 각 슬롯마다 순번대로 배정하여 자연스럽게 실력별로 Room 0, 1, 2 에 모이게 함
                for (int slot = 0; slot < perTeam; slot++) {
                    for (int rIdx = 0; rIdx < rooms.size(); rIdx++) {
                        if (currentAppIdx >= group.size())
                            break;
                        rooms.get(rIdx).add(group.get(currentAppIdx++), sCd);
                    }
                }
                // 초과 인원 배분
                while (currentAppIdx < group.size()) {
                    RoomState leastFull = rooms.stream()
                            .min(Comparator.comparingInt(r -> r.currentSessionCnt.getOrDefault(sCd, 0)))
                            .orElse(rooms.get(0));
                    leastFull.add(group.get(currentAppIdx++), sCd);
                }
            }
        }

        // [Stage 1.5] 2지망 세션 폴백 (1지망 초과 인원 중 2지망이 비어있는 곳으로 이동)
        for (RoomState r : rooms) {
            List<ClanGatherApply> currentRoomMembers = new ArrayList<>(r.members);
            for (ClanGatherApply m : currentRoomMembers) {
                String s1 = m.getSessionTypeCd1st();
                String s2 = m.getSessionTypeCd2nd();
                if (s2 == null || !targetSessionCnts.containsKey(s2))
                    continue;

                long targetS1 = targetSessionCnts.getOrDefault(s1, 0L);
                long targetS2 = targetSessionCnts.getOrDefault(s2, 0L);

                // 현재 방에서 s1이 초과 상태이고, 다른 방에서 s2가 부족 상태라면 이동 검토
                if (r.currentSessionCnt.getOrDefault(s1, 0) > targetS1) {
                    RoomState bestFallbackRoom = null;
                    int minSkillDiff = Integer.MAX_VALUE;

                    for (RoomState otherR : rooms) {
                        if (otherR.currentSessionCnt.getOrDefault(s2, 0) < targetS2) {
                            int diff = Math.abs(otherR.maxSkill - m.getSession2ndScore());
                            if (diff < minSkillDiff) {
                                minSkillDiff = diff;
                                bestFallbackRoom = otherR;
                            }
                        }
                    }

                    if (bestFallbackRoom != null) {
                        r.remove(m);
                        bestFallbackRoom.add(m, s2);
                        log.info("[Match] Fallback: User {} moved from {} to {} (Session 1st->2nd)",
                                m.getUserId(), s1, s2);
                    }
                }
            }
        }

        // 빈 방 제거 (실력 그룹화 결과 채워지지 않은 방 삭제)
        rooms.removeIf(r -> r.members.isEmpty());
        log.info("[Match] After assignment: {} non-empty rooms", rooms.size());

        try {
            java.nio.file.Files.write(java.nio.file.Paths.get("bandi_debug.log"), debugLog.toString().getBytes());
        } catch (Exception e) {
        }

        // 5. [2단계] 반복 재구성 (Refinement) - 성별/MBTI 균형 + 실력 격차 해소
        if (!isSkillBalanceOn) {
            java.util.function.Function<RoomState, Double> calcBalanceScore = (rm) -> {
                double s = 0;
                if (isGenderBalanceOn) {
                    s -= Math.abs(rm.currentGenderCnt.getOrDefault("M", 0)
                            - rm.currentGenderCnt.getOrDefault("F", 0)) * 15.0;
                }
                if (isMbtiBalanceOn) {
                    s -= Math.abs(rm.currentMbtiTypeCnt.getOrDefault("E", 0)
                            - rm.currentMbtiTypeCnt.getOrDefault("I", 0)) * 12.0;
                }
                return s;
            };

            boolean refined = true;
            int totalRounds = 0;
            while (refined && totalRounds < 5) { // 최대 5라운드 반복 최적화
                refined = false;
                totalRounds++;

                for (int r1Idx = 0; r1Idx < rooms.size(); r1Idx++) {
                    RoomState r1 = rooms.get(r1Idx);

                    for (int r2Idx = r1Idx + 1; r2Idx < rooms.size(); r2Idx++) {
                        RoomState r2 = rooms.get(r2Idx);

                        // 두 방의 멤버들을 대상으로 교체 시뮬레이션
                        List<ClanGatherApply> r1Members = new ArrayList<>(r1.members);
                        List<ClanGatherApply> r2Members = new ArrayList<>(r2.members);

                        for (ClanGatherApply m1 : r1Members) {
                            for (ClanGatherApply m2 : r2Members) {
                                // 같은 세션끼리만 교체
                                if (!m1.getSessionTypeCd1st().equals(m2.getSessionTypeCd1st()))
                                    continue;

                                double oldScore = calcBalanceScore.apply(r1) + calcBalanceScore.apply(r2);

                                String s1 = r1.assignedSessions.get(m1);
                                String s2 = r2.assignedSessions.get(m2);

                                // 가상 교체
                                r1.remove(m1);
                                r2.remove(m2);
                                r1.add(m2, s2);
                                r2.add(m1, s1);

                                // 실력 격차 조건 체크 (교체 후 모든 멤버가 maxSkill과 2단계 이내여야 함)
                                boolean isSkillValid = true;
                                for (ClanGatherApply rm : r1.members) {
                                    String rs = r1.assignedSessions.get(rm);
                                    int rScore = rs.equals(rm.getSessionTypeCd1st()) ? rm.getSession1stScore()
                                            : rm.getSession2ndScore();
                                    if (Math.abs(rScore - r1.maxSkill) > 2)
                                        isSkillValid = false;
                                }
                                for (ClanGatherApply rm : r2.members) {
                                    String rs = r2.assignedSessions.get(rm);
                                    int rScore = rs.equals(rm.getSessionTypeCd1st()) ? rm.getSession1stScore()
                                            : rm.getSession2ndScore();
                                    if (Math.abs(rScore - r2.maxSkill) > 2)
                                        isSkillValid = false;
                                }

                                double newScore = calcBalanceScore.apply(r1) + calcBalanceScore.apply(r2);

                                // 개선되었는지 확인
                                if (isSkillValid && (newScore > oldScore + 1.0)) {
                                    refined = true;
                                    log.info("[Match] Swapping {} <-> {} for balance (Score: {} -> {})",
                                            m1.getUserId(), m2.getUserId(), oldScore, newScore);
                                } else {
                                    // 원상 복구
                                    r1.remove(m2);
                                    r2.remove(m1);
                                    r1.add(m1, s1);
                                    r2.add(m2, s2);
                                }
                                if (refined)
                                    break;
                            }
                            if (refined)
                                break;
                        }
                    }
                }
            }
        }

        // 6. 결과 저장 (DB Insert)
        if (!clanMatchRoomRepository.findByGatherNo(gatherNo).isEmpty()) {
            clanMatchResultRepository.deleteByGatherNo(gatherNo);
            clanMatchRoomRepository.deleteByGatherNo(gatherNo);
        }

        for (int i = 0; i < rooms.size(); i++) {
            RoomState rs = rooms.get(i);
            if (rs.members.isEmpty())
                continue;

            ClanMatchRoom roomEntity = new ClanMatchRoom();
            roomEntity.setGatherNo(gatherNo);
            roomEntity.setRoomNm("합주 " + (i + 1) + "팀");
            roomEntity.setSkillScoreTot(rs.totalSkill);
            roomEntity.setMemberCnt(rs.members.size());
            roomEntity.setSkillScoreAvg(BigDecimal.valueOf(rs.getAvgSkill()));
            roomEntity.setInsDtime(currentDateTime);
            roomEntity.setInsId(userId);
            roomEntity.setUpdDtime(currentDateTime);
            roomEntity.setUpdId(userId);

            ClanMatchRoom savedRoom = clanMatchRoomRepository.save(roomEntity);

            for (ClanGatherApply member : rs.members) {
                String assignedSession = rs.assignedSessions.get(member);
                ClanMatchResult res = new ClanMatchResult();
                res.setGatherNo(gatherNo);
                res.setRoomNo(savedRoom.getRoomNo());
                res.setUserId(member.getUserId());
                res.setSessionTypeCd(assignedSession);
                res.setMatchDate(currentDateTime.substring(0, 8));
                res.setInsDtime(currentDateTime);
                res.setInsId(userId);
                res.setUpdDtime(currentDateTime);
                res.setUpdId(userId);
                clanMatchResultRepository.save(res);
            }
        }

        gather.setGatherProcFg("M");
        gather.setUpdDtime(currentDateTime);
        gather.setUpdId(userId);
        clanGatherRepository.save(gather);
    }

    @Transactional
    public void completeGathering(Long gatherNo, String userId) {
        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new IllegalArgumentException("Gathering space notice not found"));

        if (!gather.getInsId().equals(userId)) {
            // Admin check
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            if (!"Y".equals(user.getAdminYn())) {
                throw new IllegalArgumentException("Only the creator or an admin can complete the gathering");
            }
        }

        gather.setGatherProcFg("E");
        gather.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        gather.setUpdId(userId);
        clanGatherRepository.save(gather);
    }

    @Transactional(readOnly = true)
    public List<GatheringMatchResultDto> getMatchResults(Long gatherNo) {
        List<ClanMatchRoom> rooms = clanMatchRoomRepository.findByGatherNo(gatherNo);
        List<ClanMatchResult> results = clanMatchResultRepository.findByGatherNo(gatherNo);
        List<ClanGatherSession> rawSessions = clanGatherSessionRepository.findByGatherNo(gatherNo);
        List<ClanGatherApply> allApplicants = clanGatherApplyRepository.findByGatherNo(gatherNo);

        Map<String, String> sessionNames = commDetailRepository.findActiveDetailsByCommCd("BD100")
                .stream().collect(Collectors.toMap(CommDetail::getCommDtlCd, CommDetail::getCommDtlNm));

        // Create standard list of required session names based on CN_BN_SESSION
        // quantities
        List<String> standardRequiredSessions = new ArrayList<>();
        List<String> standardRequiredSessionCds = new ArrayList<>();
        if (rawSessions != null) {
            for (ClanGatherSession s : rawSessions) {
                standardRequiredSessions.add(sessionNames.getOrDefault(s.getSessionTypeCd(), s.getSessionTypeCd()));
                standardRequiredSessionCds.add(s.getSessionTypeCd());
            }
        }

        Map<String, String> userNames = new HashMap<>(); // cache to avoid N+1 querying in loop for duplicates
        for (ClanMatchResult r : results) {
            if (!userNames.containsKey(r.getUserId())) {
                String name = userRepository.findById(r.getUserId()).map(User::getUserNickNm).orElse(r.getUserId());
                userNames.put(r.getUserId(), name);
            }
        }

        Map<String, String> userGenders = allApplicants.stream()
                .collect(Collectors.toMap(ClanGatherApply::getUserId,
                        a -> a.getUserGenderCd() != null ? a.getUserGenderCd() : "M",
                        (v1, v2) -> v1));

        Map<String, Integer> userScores = allApplicants.stream()
                .collect(Collectors.toMap(ClanGatherApply::getUserId, ClanGatherApply::getSession1stScore,
                        (v1, v2) -> v1));

        Map<String, String> userMbtis = allApplicants.stream()
                .collect(Collectors.toMap(ClanGatherApply::getUserId,
                        a -> a.getUserMbti() != null ? a.getUserMbti() : "",
                        (v1, v2) -> v1));

        List<GatheringMatchResultDto> dtoList = new ArrayList<>();
        for (ClanMatchRoom room : rooms) {
            GatheringMatchResultDto rdto = new GatheringMatchResultDto();
            rdto.setRoomNo(room.getRoomNo());
            rdto.setGatherNo(room.getGatherNo());
            rdto.setRoomNm(room.getRoomNm());
            rdto.setSkillScoreTot(room.getSkillScoreTot());
            rdto.setMemberCnt(room.getMemberCnt());
            rdto.setSkillScoreAvg(room.getSkillScoreAvg());
            rdto.setRequiredSessionNmList(standardRequiredSessions);
            rdto.setRequiredSessionCdList(standardRequiredSessionCds);

            List<GatheringMatchMemberDto> filteredMembers = results.stream()
                    .filter(res -> res.getRoomNo().equals(room.getRoomNo()))
                    .map(res -> {
                        GatheringMatchMemberDto mdto = new GatheringMatchMemberDto();
                        mdto.setResultNo(res.getResultNo());
                        mdto.setUserId(res.getUserId());
                        mdto.setUserNickNm(userNames.getOrDefault(res.getUserId(), res.getUserId()));
                        mdto.setSessionTypeCd(res.getSessionTypeCd());
                        mdto.setSessionTypeNm(
                                sessionNames.getOrDefault(res.getSessionTypeCd(), res.getSessionTypeCd()));
                        mdto.setSkillScore(userScores.getOrDefault(res.getUserId(), 0));
                        mdto.setUserGenderCd(userGenders.getOrDefault(res.getUserId(), "M"));
                        mdto.setUserMbti(userMbtis.getOrDefault(res.getUserId(), ""));
                        return mdto;
                    }).collect(Collectors.toList());

            rdto.setMembers(filteredMembers);
            dtoList.add(rdto);
        }
        return dtoList;
    }

    @Transactional
    public void swapMembers(Long gatherNo, MatchSwapRequestDto request) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 1. Handle From User
        if (request.getFromUserId() != null && !request.getFromUserId().isEmpty()) {
            ClanMatchResult fromResult = clanMatchResultRepository.findByGatherNoAndRoomNoAndUserId(
                    gatherNo, request.getFromRoomNo(), request.getFromUserId());
            if (fromResult != null) {
                fromResult.setRoomNo(request.getToRoomNo());
                fromResult.setSessionTypeCd(request.getToSessionCd());
                fromResult.setUpdId(request.getUserId());
                fromResult.setUpdDtime(currentDateTime);
                clanMatchResultRepository.save(fromResult);
            }
        }

        // 2. Handle To User
        if (request.getToUserId() != null && !request.getToUserId().isEmpty()) {
            ClanMatchResult toResult = clanMatchResultRepository.findByGatherNoAndRoomNoAndUserId(
                    gatherNo, request.getToRoomNo(), request.getToUserId());
            if (toResult != null) {
                toResult.setRoomNo(request.getFromRoomNo());
                toResult.setSessionTypeCd(request.getFromSessionCd());
                toResult.setUpdId(request.getUserId());
                toResult.setUpdDtime(currentDateTime);
                clanMatchResultRepository.save(toResult);
            }
        }

        // 3. Recalculate stats for both rooms
        updateRoomStats(gatherNo, request.getFromRoomNo(), request.getUserId());
        updateRoomStats(gatherNo, request.getToRoomNo(), request.getUserId());
    }

    private void updateRoomStats(Long gatherNo, Long roomNo, String userId) {
        ClanMatchRoom room = clanMatchRoomRepository.findById(roomNo).orElse(null);
        if (room == null)
            return;

        List<ClanMatchResult> results = clanMatchResultRepository.findByRoomNo(roomNo);
        int totalScore = 0;
        int count = results.size();

        for (ClanMatchResult res : results) {
            ClanGatherApply apply = clanGatherApplyRepository.findByGatherNoAndUserId(gatherNo, res.getUserId())
                    .orElse(null);
            if (apply != null) {
                totalScore += apply.getSession1stScore();
            }
        }

        double avg = count > 0 ? (double) totalScore / count : 0;
        room.setSkillScoreTot(totalScore);
        room.setMemberCnt(count);
        room.setSkillScoreAvg(BigDecimal.valueOf(avg));
        room.setUpdId(userId);
        room.setUpdDtime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
        clanMatchRoomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public String getGatheringRoomCrdYn(Long gatherNo) {
        return clanGatherRepository.findById(gatherNo)
                .map(ClanGather::getBnRoomCrdYn)
                .orElse("N");
    }

    @Transactional
    public void createJamRoomsFromMatch(Long gatherNo, String userId) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String todayDate = currentDateTime.substring(0, 8);

        ClanGather gather = clanGatherRepository.findById(gatherNo)
                .orElseThrow(() -> new RuntimeException("합주 모집 공고를 찾을 수 없습니다."));

        if ("Y".equals(gather.getBnRoomCrdYn())) {
            throw new RuntimeException("이미 합주방 생성이 완료된 공고입니다.");
        }

        // 권한 체크
        String role = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜 관리자 또는 운영진만 합주방을 일괄 생성할 수 있습니다.");
        }

        List<ClanMatchRoom> matchRooms = clanMatchRoomRepository.findByGatherNo(gatherNo);
        if (matchRooms.isEmpty()) {
            throw new RuntimeException("생성할 매핑 결과(합주방)가 존재하지 않습니다.");
        }

        List<ClanGatherSession> gatheredSessions = clanGatherSessionRepository.findByGatherNo(gatherNo);
        log.info("[JamRoomBatch] Starting for gatherNo: {}, userId: {}", gatherNo, userId);
        int roomCnt = (gather.getRoomCnt() == null || gather.getRoomCnt() == 0) ? 1 : gather.getRoomCnt();
        log.info("[JamRoomBatch] roomCnt: {}", roomCnt);

        // 방당 필요한 세션 목록 계산 (전체 세션 / 방 개수)
        Map<String, Long> totalSessionCounts = gatheredSessions.stream()
                .collect(Collectors.groupingBy(ClanGatherSession::getSessionTypeCd, Collectors.counting()));

        List<String> perRoomRequiredCds = new ArrayList<>();
        totalSessionCounts.forEach((cd, count) -> {
            long perRoomGoal = (long) Math.ceil((double) count / (double) roomCnt);
            log.info("[JamRoomBatch] SessionTemplate - cd: {}, total: {}, goalPerRoom: {}", cd, count, perRoomGoal);
            for (int i = 0; i < perRoomGoal; i++) {
                perRoomRequiredCds.add(cd);
            }
        });

        for (ClanMatchRoom matchRoom : matchRooms) {
            List<ClanMatchResult> results = clanMatchResultRepository.findByRoomNo(matchRoom.getRoomNo());
            if (results.isEmpty())
                continue; // 매칭된 인원이 없으면 방을 만들지 않음 (Reverted)

            // 리더(방장) 선출: 가장 권한이 높은 클랜 유저
            String leaderUserId = results.get(0).getUserId(); // Default
            int highestPriority = 999;

            if (!results.isEmpty()) {
                for (ClanMatchResult res : results) {
                    int rolePriority = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), res.getUserId()))
                            .map(u -> {
                                try {
                                    return Integer.parseInt(u.getCnUserRoleCd());
                                } catch (Exception e) {
                                    return 99;
                                }
                            })
                            .orElse(99);

                    if (rolePriority < highestPriority) {
                        highestPriority = rolePriority;
                        leaderUserId = res.getUserId();
                    }
                }
            }

            // 1. BN_GROUP 생성
            com.bandi.backend.entity.band.BnGroup bnGroup = new com.bandi.backend.entity.band.BnGroup();
            bnGroup.setBnType("CLAN");
            bnGroup.setCnNo(gather.getCnNo());
            bnGroup.setBnNm(matchRoom.getRoomNm());
            bnGroup.setBnSongNm("미정");
            bnGroup.setBnSingerNm("미정");
            bnGroup.setBnPasswdFg("N");
            bnGroup.setBnDesc(gather.getTitle() + " 매핑으로 생성된 합주방입니다.");
            bnGroup.setBnLeaderId(leaderUserId); // 선출된 리더
            bnGroup.setBnConfFg("N");
            bnGroup.setBnStatCd("A");
            bnGroup.setInsDtime(currentDateTime);
            bnGroup.setInsId(userId);
            bnGroup.setUpdDtime(currentDateTime);
            bnGroup.setUpdId(userId);

            com.bandi.backend.entity.band.BnGroup savedGroup = bnGroupRepository.save(bnGroup);
            Long bnNo = savedGroup.getBnNo();

            // 2. CN_BN_MATCH_ROOM 업데이트 (외래키 연결)
            matchRoom.setBnNo(bnNo);
            matchRoom.setUpdDtime(currentDateTime);
            matchRoom.setUpdId(userId);
            clanMatchRoomRepository.save(matchRoom);

            // 3. 채팅방 생성
            com.bandi.backend.entity.band.BandChatRoom chatRoom = new com.bandi.backend.entity.band.BandChatRoom();
            chatRoom.setBnNo(bnNo);
            chatRoom.setBnRoomNm(bnGroup.getBnNm());
            chatRoom.setInsDtime(currentDateTime);
            chatRoom.setInsId(userId);
            chatRoom.setUpdDtime(currentDateTime);
            chatRoom.setUpdId(userId);
            bandChatRoomRepository.save(chatRoom);

            // 4. BN_USER / BN_SESSION 생성
            List<String> remainingSessions = new ArrayList<>(perRoomRequiredCds);

            for (ClanMatchResult res : results) {
                // BN_USER
                com.bandi.backend.entity.band.BnUser bnUser = new com.bandi.backend.entity.band.BnUser();
                bnUser.setBnNo(bnNo);
                bnUser.setBnUserId(res.getUserId());
                bnUser.setBnRoleCd(res.getUserId().equals(leaderUserId) ? "LEAD" : "NORL");
                bnUser.setBnJoinDate(todayDate);
                bnUser.setBnUserStatCd("A");
                bnUser.setInsDtime(currentDateTime);
                bnUser.setInsId(userId);
                bnUser.setUpdDtime(currentDateTime);
                bnUser.setUpdId(userId);
                bnUserRepository.save(bnUser);

                // BN_SESSION
                com.bandi.backend.entity.band.BnSession bnSession = new com.bandi.backend.entity.band.BnSession();
                bnSession.setBnNo(bnNo);
                bnSession.setBnSessionTypeCd(res.getSessionTypeCd());
                bnSession.setBnSessionJoinUserId(res.getUserId());
                bnSession.setInsDtime(currentDateTime);
                bnSession.setInsId(userId);
                bnSession.setUpdDtime(currentDateTime);
                bnSession.setUpdId(userId);
                bnSessionRepository.save(bnSession);

                remainingSessions.remove(res.getSessionTypeCd());
            }

            // 5. 빈 세션 (모집이 덜 된 파트) 생성
            for (String emptyCd : remainingSessions) {
                com.bandi.backend.entity.band.BnSession emptySession = new com.bandi.backend.entity.band.BnSession();
                emptySession.setBnNo(bnNo);
                emptySession.setBnSessionTypeCd(emptyCd);
                emptySession.setInsDtime(currentDateTime);
                emptySession.setInsId(userId);
                emptySession.setUpdDtime(currentDateTime);
                emptySession.setUpdId(userId);
                bnSessionRepository.save(emptySession);
            }
        }

        // 최종 상태 플래그 업데이트
        gather.setBnRoomCrdYn("Y");
        gather.setUpdDtime(currentDateTime);
        gather.setUpdId(userId);
        clanGatherRepository.save(gather);
        log.info("[JamRoomBatch] Successfully finished for gatherNo: {}", gatherNo);
    }
}
