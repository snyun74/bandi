package com.bandi.backend.service;

import com.bandi.backend.dto.*;
import com.bandi.backend.entity.clan.*;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import lombok.RequiredArgsConstructor;
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

        // 2. 가중치 보조 데이터 로드
        List<ClanGatherWeight> weights = clanGatherWeightRepository.findByGatherNo(gatherNo);
        int skillWeight = weights.stream().filter(w -> "SKILL".equals(w.getGatherTypeCd())).findFirst()
                .map(ClanGatherWeight::getWeightValue).orElse(5);
        int gendWeight = weights.stream().filter(w -> "GEND".equals(w.getGatherTypeCd())).findFirst()
                .map(ClanGatherWeight::getWeightValue).orElse(5);

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

        // 세션별 정렬 (실력 높은 순)
        Map<String, List<ClanGatherApply>> applicantsBySession = validApplicants.stream()
                .collect(Collectors.groupingBy(
                        ClanGatherApply::getSessionTypeCd1st,
                        Collectors.collectingAndThen(Collectors.toList(), list -> {
                            list.sort((a, b) -> Integer.compare(b.getSession1stScore(), a.getSession1stScore()));
                            return list;
                        })));

        // 5. 방 초기화 플래닝 (순차 채움 방식)
        // 기존: roomCnt 만큼 처음부터 생성하여 흩뿌림
        // 변경: 1개 방부터 시작하여, 세션 정원이 차면 다음 방을 동적으로 생성
        class RoomState {
            int roomIndex;
            int totalSkill = 0;
            Map<String, Integer> currentSessionCnt = new HashMap<>(); // 세션별 현재 인원
            Map<String, Integer> currentGenderCnt = new HashMap<>(); // 성별별 현재 인원
            List<ClanGatherApply> members = new ArrayList<>();
        }

        List<RoomState> rooms = new ArrayList<>();
        // 최소 1개의 방은 무조건 생성
        RoomState firstRoom = new RoomState();
        firstRoom.roomIndex = 0;
        rooms.add(firstRoom);

        // 이전 결과가 있다면 삭제 (재매핑)
        List<ClanMatchRoom> oldRooms = clanMatchRoomRepository.findByGatherNo(gatherNo);
        if (!oldRooms.isEmpty()) {
            clanMatchResultRepository.deleteByGatherNo(gatherNo);
            clanMatchRoomRepository.deleteByGatherNo(gatherNo);
        }

        // 6. 매칭 할당 로직 (세션별로 순회하며 순차 배정)
        for (String sessionCd : targetSessionCnts.keySet()) {
            List<ClanGatherApply> appsForSession = applicantsBySession.getOrDefault(sessionCd, new ArrayList<>());
            long sessionTargetCnt = targetSessionCnts.get(sessionCd);

            for (ClanGatherApply app : appsForSession) {
                // 이 사람을 배정할 방 식별: 정원이 차지 않은 기존 방들
                List<RoomState> eligibleRooms = rooms.stream()
                        .filter(r -> r.currentSessionCnt.getOrDefault(sessionCd, 0) < sessionTargetCnt)
                        .collect(Collectors.toList());

                // 만약 모든 기존 방의 해당 세션 정원이 찼다면, 새로운 방을 개설
                if (eligibleRooms.isEmpty()) {
                    RoomState newRoom = new RoomState();
                    newRoom.roomIndex = rooms.size();
                    rooms.add(newRoom);
                    eligibleRooms.add(newRoom);
                }

                // 가용한 방들 중에서 가중치 점수 계산
                RoomState bestRoom = null;
                double maxScore = -Double.MAX_VALUE;

                for (RoomState r : eligibleRooms) {
                    double score = 0;

                    // 실력 가중치: (다른 방 최대 총합 - 내 방 총합) * 가중치
                    int maxTotalSkill = eligibleRooms.stream().mapToInt(rm -> rm.totalSkill).max().orElse(0);
                    score += (maxTotalSkill - r.totalSkill) * skillWeight;

                    // 성별 가중치: (다른 방 최대 같은 성별 - 내 방 같은 성별) * 가중치
                    if (app.getUserGenderCd() != null && !app.getUserGenderCd().isEmpty()) {
                        String userGender = app.getUserGenderCd();
                        int maxSameGender = eligibleRooms.stream()
                                .mapToInt(rm -> rm.currentGenderCnt.getOrDefault(userGender, 0)).max().orElse(0);
                        score += (maxSameGender - r.currentGenderCnt.getOrDefault(userGender, 0)) * gendWeight;
                    }

                    if (score > maxScore) {
                        maxScore = score;
                        bestRoom = r;
                    }
                }

                if (bestRoom == null && !eligibleRooms.isEmpty()) {
                    bestRoom = eligibleRooms.get(0);
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

        Map<String, String> sessionNames = commDetailRepository.findActiveDetailsByCommCd("BD100")
                .stream().collect(Collectors.toMap(CommDetail::getCommDtlCd, CommDetail::getCommDtlNm));

        // Create standard list of required session names based on CN_BN_SESSION
        // quantities
        List<String> standardRequiredSessions = new ArrayList<>();
        if (rawSessions != null) {
            for (ClanGatherSession s : rawSessions) {
                standardRequiredSessions.add(sessionNames.getOrDefault(s.getSessionTypeCd(), s.getSessionTypeCd()));
            }
        }

        Map<String, String> userNames = new HashMap<>(); // cache to avoid N+1 querying in loop for duplicates
        for (ClanMatchResult r : results) {
            if (!userNames.containsKey(r.getUserId())) {
                String name = userRepository.findById(r.getUserId()).map(User::getUserNickNm).orElse(r.getUserId());
                userNames.put(r.getUserId(), name);
            }
        }

        List<GatheringMatchResultDto> dtoList = new ArrayList<>();
        for (ClanMatchRoom room : rooms) {
            GatheringMatchResultDto rdto = new GatheringMatchResultDto();
            rdto.setRoomNo(room.getRoomNo());
            rdto.setGatherNo(room.getGatherNo());
            rdto.setRoomNm(room.getRoomNm());
            rdto.setSkillScoreTot(room.getSkillScoreTot());
            rdto.setMemberCnt(room.getMemberCnt());
            rdto.setSkillScoreAvg(room.getSkillScoreAvg());
            rdto.setRequiredSessionNmList(standardRequiredSessions); // Insert standard requirements here

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
                        return mdto;
                    }).collect(Collectors.toList());

            rdto.setMembers(filteredMembers);
            dtoList.add(rdto);
        }
        return dtoList;
    }
}
