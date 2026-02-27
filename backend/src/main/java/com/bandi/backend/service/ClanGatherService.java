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
        log.info("[Match] Checking permission - gatherNo: {}, clanNo: {}, userId: {}", gatherNo, gather.getCnNo(),
                userId);
        String role = clanUserRepository.findById(new ClanUserId(gather.getCnNo(), userId))
                .map(ClanUser::getCnUserRoleCd)
                .orElse("NONE");
        log.info("[Match] Found role: {}", role);

        if (!"01".equals(role) && !"02".equals(role)) {
            throw new RuntimeException("클랜 관리자 또는 운영진만 매칭을 진행할 수 있습니다.");
        }
        if (!"Y".equals(gather.getGatherProcFg()) && !"M".equals(gather.getGatherProcFg())) {
            throw new RuntimeException("모집종료('Y') 또는 매핑완료('M') 상태인 공고만 매칭을 진행할 수 있습니다.");
        }

        // 2. 가중치 보조 데이터 로드
        List<ClanGatherWeight> weights = clanGatherWeightRepository.findByGatherNo(gatherNo);

        // 3. 모집 세션 로드 및 방별 목표 인원 도출
        List<ClanGatherSession> sessions = clanGatherSessionRepository.findByGatherNo(gatherNo);
        if (sessions.isEmpty()) {
            throw new RuntimeException("모집 세션 정보가 없습니다.");
        }
        Map<String, Long> targetSessionCnts = sessions.stream()
                .collect(Collectors.groupingBy(ClanGatherSession::getSessionTypeCd, Collectors.counting()));

        // 4. 신청자 데이터 준비
        List<ClanGatherApply> allApplicants = clanGatherApplyRepository.findByGatherNo(gatherNo);

        // 필터링: 모집 세션에 포함된 1지망 신청자만
        List<ClanGatherApply> validApplicants = allApplicants.stream()
                .filter(a -> targetSessionCnts.containsKey(a.getSessionTypeCd1st()))
                .collect(Collectors.toList());

        // 4. 세션별 정렬 -> 전체 점수순 정렬로 변경 (실력별 그룹화를 위해 모든 세션의 고수가 먼저 배치되도록 함)
        validApplicants.sort((a, b) -> Integer.compare(b.getSession1stScore(), a.getSession1stScore()));

        // 5. 방 초기화 플래닝 (순차 채움 방식)
        // 기존: roomCnt 만큼 처음부터 생성하여 흩뿌림
        // 변경: 1개 방부터 시작하여, 세션 정원이 차면 다음 방을 동적으로 생성
        class RoomState {
            int totalSkill = 0;
            Map<String, Integer> currentSessionCnt = new HashMap<>(); // 세션별 현재 인원
            Map<String, Integer> currentGenderCnt = new HashMap<>(); // 성별별 현재 인원
            Map<String, Integer> currentMbtiTypeCnt = new HashMap<>(); // MBTI 유형별(I/E) 현재 인원
            List<ClanGatherApply> members = new ArrayList<>();
        }

        List<RoomState> rooms = new ArrayList<>();
        // 최소 1개의 방은 무조건 생성
        rooms.add(new RoomState());

        // 이전 결과가 있다면 삭제 (재매핑)
        List<ClanMatchRoom> oldRooms = clanMatchRoomRepository.findByGatherNo(gatherNo);
        if (!oldRooms.isEmpty()) {
            clanMatchResultRepository.deleteByGatherNo(gatherNo);
            clanMatchRoomRepository.deleteByGatherNo(gatherNo);
        }

        // 6. 매칭 할당 로직 (전체 실력순으로 순회하며 최적의 방 배정)
        for (ClanGatherApply app : validApplicants) {
            String sessionCd = app.getSessionTypeCd1st();
            long sessionTargetCnt = targetSessionCnts.getOrDefault(sessionCd, 0L);

            if (sessionTargetCnt <= 0)
                continue;
            // 이 사람을 배정할 방 식별: 정원이 차지 않은 기존 방들
            List<RoomState> eligibleRooms = rooms.stream()
                    .filter(r -> r.currentSessionCnt.getOrDefault(sessionCd, 0) < sessionTargetCnt)
                    .collect(Collectors.toCollection(ArrayList::new));

            // 가용한 방들 중에서 점수 계산 (가중치는 무시하고 토글 여부만 판단)
            RoomState bestRoom = null;
            double maxScore = -Double.MAX_VALUE;

            boolean isSkillBalanceOn = weights.stream()
                    .filter(w -> w.getGatherTypeCd().equals("SKILL"))
                    .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);
            boolean isGenderBalanceOn = weights.stream()
                    .filter(w -> w.getGatherTypeCd().equals("GENDER"))
                    .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);
            boolean isMbtiBalanceOn = weights.stream()
                    .filter(w -> w.getGatherTypeCd().equals("MBTI"))
                    .map(w -> "Y".equals(w.getBalanceApplyYn())).findFirst().orElse(true);

            for (RoomState r : eligibleRooms) {
                double score = 0;

                // 1. 실력 로직
                if (isSkillBalanceOn) {
                    // ON: 평준화 (팀 간 실력 합계 균등)
                    int maxTotalSkill = eligibleRooms.stream().mapToInt(rm -> rm.totalSkill).max().orElse(0);
                    score += (maxTotalSkill - r.totalSkill);
                } else {
                    // OFF: 실력별 그룹화 (끼리끼리)
                    // 내 레벨과 방 멤버들의 평균 레벨 차이가 작을수록 높은 점수
                    double roomAvgSkill = r.members.isEmpty() ? 0 : (double) r.totalSkill / r.members.size();
                    if (r.members.isEmpty()) {
                        // 빈 방: 중간 점수
                        score += 2.5 * 20.0;
                    } else {
                        // 내 레벨과 방 평균 레벨이 비슷할수록 가점 (비중 대폭 강화)
                        score += (5.0 - Math.abs(app.getSession1stScore() - roomAvgSkill)) * 20.0;

                        // 집결(Clustering) 가점: 내 실력과 맞는 방이라면 빈 방보다 이미 사람이 있는 방을 선호
                        // 이를 통해 고수팀/초보팀이 확실히 먼저 채워지도록 유도
                        score += r.members.size() * 5.0;

                        // 실력 편차 감점 로직 (강력 유지)
                        for (ClanGatherApply member : r.members) {
                            if (Math.abs(app.getSession1stScore() - member.getSession1stScore()) >= 2) {
                                score -= 200.0;
                                break;
                            }
                        }
                    }
                }

                // 2. 성별 로직
                if (isGenderBalanceOn && app.getUserGenderCd() != null && !app.getUserGenderCd().isEmpty()) {
                    String userGender = app.getUserGenderCd();
                    int maxSameGender = eligibleRooms.stream()
                            .mapToInt(rm -> rm.currentGenderCnt.getOrDefault(userGender, 0)).max().orElse(0);
                    score += (maxSameGender - r.currentGenderCnt.getOrDefault(userGender, 0));
                }

                // 3. MBTI 로직
                if (isMbtiBalanceOn && app.getUserMbti() != null && app.getUserMbti().length() > 0) {
                    String mbtiChar = app.getUserMbti().substring(0, 1).toUpperCase();
                    if ("I".equals(mbtiChar) || "E".equals(mbtiChar)) {
                        int maxSameMbti = eligibleRooms.stream()
                                .mapToInt(rm -> rm.currentMbtiTypeCnt.getOrDefault(mbtiChar, 0)).max().orElse(0);
                        score += (maxSameMbti - r.currentMbtiTypeCnt.getOrDefault(mbtiChar, 0));
                    }
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestRoom = r;
                }
            }

            if (bestRoom == null || (maxScore < -10.0 && rooms.size() < gather.getRoomCnt())) {
                // 가용한 방이 아예 없거나, 실력 편차 패널티가 큰데 아직 목표 팀 수까지 여유가 있는 경우
                RoomState emptyRoom = eligibleRooms.stream().filter(r -> r.members.isEmpty()).findFirst().orElse(null);
                if (emptyRoom != null) {
                    bestRoom = emptyRoom;
                } else if (bestRoom == null || rooms.size() < gather.getRoomCnt()) {
                    // 배정 가능한 방이 아예 없거나, 팀 수 여유가 있을 때만 신규 생성
                    rooms.add(new RoomState());
                    bestRoom = rooms.get(rooms.size() - 1);
                }
            }

            // 배정 및 상탯값 업데이트
            if (bestRoom != null) {
                bestRoom.members.add(app);
                bestRoom.totalSkill += app.getSession1stScore();
                bestRoom.currentSessionCnt.put(sessionCd,
                        bestRoom.currentSessionCnt.getOrDefault(sessionCd, 0) + 1);
                if (app.getUserGenderCd() != null && !app.getUserGenderCd().isEmpty()) {
                    bestRoom.currentGenderCnt.put(app.getUserGenderCd(),
                            bestRoom.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0) + 1);
                }
                if (app.getUserMbti() != null && app.getUserMbti().length() > 0) {
                    String mbtiChar = app.getUserMbti().substring(0, 1).toUpperCase();
                    if ("I".equals(mbtiChar) || "E".equals(mbtiChar)) {
                        bestRoom.currentMbtiTypeCnt.put(mbtiChar,
                                bestRoom.currentMbtiTypeCnt.getOrDefault(mbtiChar, 0) + 1);
                    }
                }
            }
        }

        // 7. 결과 저장 (DB Insert)
        for (int i = 0; i < rooms.size(); i++) {
            RoomState rs = rooms.get(i);

            ClanMatchRoom roomEntity = new ClanMatchRoom();
            roomEntity.setGatherNo(gatherNo);
            roomEntity.setRoomNm("합주 " + (i + 1) + "팀");
            roomEntity.setSkillScoreTot(rs.totalSkill);
            roomEntity.setMemberCnt(rs.members.size());

            double avg = rs.members.isEmpty() ? 0 : (double) rs.totalSkill / rs.members.size();
            roomEntity.setSkillScoreAvg(BigDecimal.valueOf(avg));

            roomEntity.setInsDtime(currentDateTime);
            roomEntity.setInsId(userId);
            roomEntity.setUpdDtime(currentDateTime);
            roomEntity.setUpdId(userId);

            ClanMatchRoom savedRoom = clanMatchRoomRepository.save(roomEntity);

            for (ClanGatherApply member : rs.members) {
                ClanMatchResult resultEntity = new ClanMatchResult();
                resultEntity.setGatherNo(gatherNo);
                resultEntity.setRoomNo(savedRoom.getRoomNo());
                resultEntity.setUserId(member.getUserId());
                resultEntity.setSessionTypeCd(member.getSessionTypeCd1st());
                resultEntity.setMatchDate(currentDateTime.substring(0, 8)); // yyyyMMdd
                resultEntity.setInsDtime(currentDateTime);
                resultEntity.setInsId(userId);
                resultEntity.setUpdDtime(currentDateTime);
                resultEntity.setUpdId(userId);

                clanMatchResultRepository.save(resultEntity);
            }
        }

        // 8. 모집 공고 상태 업데이트 (M: 매칭완료)
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
}
