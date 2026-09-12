package com.bandi.backend.service;

import com.bandi.backend.dto.CnRoomScheduleDto;
import com.bandi.backend.dto.EligibleClanJamDto;
import com.bandi.backend.entity.band.BnGroup;
import com.bandi.backend.entity.band.BnUser;
import com.bandi.backend.entity.band.BnUserId;
import com.bandi.backend.entity.clan.CnRoomSchedule;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CnRoomScheduleService {

    private final CnRoomScheduleRepository cnRoomScheduleRepository;
    private final BnGroupRepository bnGroupRepository;
    private final BnUserRepository bnUserRepository;
    private final UserRepository userRepository;
    private final CmAttachmentRepository cmAttachmentRepository;

    private static final DateTimeFormatter DTIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * 특정 클랜에서 현재 유저가 예약 가능한 합주방 목록 조회 (진행 'N', 확정 'Y' 상태인 합주방의 멤버)
     */
    @Transactional(readOnly = true)
    public List<EligibleClanJamDto> getEligibleJams(Long clanId, String userId) {
        if (clanId == null || userId == null || userId.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. 해당 클랜의 활성 합주방 목록 조회
        List<BnGroup> groups = bnGroupRepository.findByCnNoAndBnConfFgAndBnStatCd(clanId, "N", "A");
        List<BnGroup> confirmedGroups = bnGroupRepository.findByCnNoAndBnConfFgAndBnStatCd(clanId, "Y", "A");

        List<BnGroup> allClanGroups = new ArrayList<>();
        allClanGroups.addAll(groups);
        allClanGroups.addAll(confirmedGroups);

        List<EligibleClanJamDto> eligibleJams = new ArrayList<>();

        for (BnGroup group : allClanGroups) {
            BnUserId bnUserId = new BnUserId(group.getBnNo(), userId);
            Optional<BnUser> bnUserOpt = bnUserRepository.findById(bnUserId);
            if (bnUserOpt.isPresent() && "A".equals(bnUserOpt.get().getBnUserStatCd())) {
                String imgUrl = null;
                if (group.getAttachNo() != null) {
                    CmAttachment att = cmAttachmentRepository.findById(group.getAttachNo()).orElse(null);
                    if (att != null) {
                        imgUrl = att.getFilePath();
                    }
                }

                eligibleJams.add(EligibleClanJamDto.builder()
                        .bnNo(group.getBnNo())
                        .cnNo(group.getCnNo())
                        .bnNm(group.getBnNm())
                        .bnSongNm(group.getBnSongNm())
                        .bnSingerNm(group.getBnSingerNm())
                        .bnConfFg(group.getBnConfFg())
                        .bnImg(imgUrl)
                        .role(bnUserOpt.get().getBnRoleCd())
                        .build());
            }
        }

        return eligibleJams;
    }

    /**
     * 기간별 동아리방 예약 스케쥴 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CnRoomScheduleDto> getRoomSchedules(Long clanId, String startDate, String endDate, String currentUserId) {
        List<CnRoomSchedule> schedules = cnRoomScheduleRepository.findAllByCnNoAndDateRange(clanId, startDate, endDate);
        String nowStr = LocalDateTime.now().format(DTIME_FORMATTER);

        Map<Long, BnGroup> groupCache = new HashMap<>();
        Map<String, User> userCache = new HashMap<>();
        Map<Long, String> attachCache = new HashMap<>();

        return schedules.stream().map(schedule -> {
            BnGroup group = groupCache.computeIfAbsent(schedule.getBnNo(),
                    k -> bnGroupRepository.findById(k).orElse(null));

            User creator = userCache.computeIfAbsent(schedule.getInsId(),
                    k -> userRepository.findById(k).orElse(null));

            String groupImg = null;
            if (group != null && group.getAttachNo() != null) {
                groupImg = attachCache.computeIfAbsent(group.getAttachNo(),
                        k -> cmAttachmentRepository.findById(k).map(CmAttachment::getFilePath).orElse(null));
            }

            String userProfileImg = null;
            if (creator != null && creator.getAttachNo() != null) {
                userProfileImg = attachCache.computeIfAbsent(creator.getAttachNo(),
                        k -> cmAttachmentRepository.findById(k).map(CmAttachment::getFilePath).orElse(null));
            }

            // 삭제 가능 여부: 현재 시점 이후이고, 본인 등록 건 또는 그룹/클랜 권한
            String scheduleStartDateTime = normalizeDateTime(schedule.getSchSttDate(), schedule.getSchSttTime());
            boolean isFuture = scheduleStartDateTime.compareTo(nowStr) > 0;
            boolean isOwner = currentUserId != null && currentUserId.equals(schedule.getInsId());
            boolean canDelete = isFuture && isOwner;

            return CnRoomScheduleDto.builder()
                    .cnSchNo(schedule.getCnSchNo())
                    .cnNo(schedule.getCnNo())
                    .bnNo(schedule.getBnNo())
                    .bnNm(group != null ? group.getBnNm() : "합주방")
                    .bnSongNm(group != null ? group.getBnSongNm() : "")
                    .bnSingerNm(group != null ? group.getBnSingerNm() : "")
                    .bnImg(groupImg)
                    .schSttDate(schedule.getSchSttDate())
                    .schSttTime(schedule.getSchSttTime())
                    .schEndDate(schedule.getSchEndDate())
                    .schEndTime(schedule.getSchEndTime())
                    .schStatCd(schedule.getSchStatCd())
                    .insDtime(schedule.getInsDtime())
                    .insId(schedule.getInsId())
                    .userNickNm(creator != null ? creator.getUserNickNm() : schedule.getInsId())
                    .profileImageUrl(userProfileImg)
                    .canDelete(canDelete)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * 동아리방 예약 등록 (저장 시점 실시간 중복 체크)
     */
    @Transactional
    public CnRoomScheduleDto createSchedule(CnRoomScheduleDto dto, String userId) {
        if (dto.getCnNo() == null || dto.getBnNo() == null) {
            throw new IllegalArgumentException("클랜 번호와 합주 번호는 필수입니다.");
        }
        if (dto.getSchSttDate() == null || dto.getSchSttTime() == null ||
            dto.getSchEndDate() == null || dto.getSchEndTime() == null) {
            throw new IllegalArgumentException("시작 일시 및 종료 일시는 필수입니다.");
        }

        String sttTime = padTime(dto.getSchSttTime());
        String endTime = padTime(dto.getSchEndTime());
        String newStartDateTime = dto.getSchSttDate() + sttTime;
        String newEndDateTime = dto.getSchEndDate() + endTime;

        if (newStartDateTime.compareTo(newEndDateTime) >= 0) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 앞서야 합니다.");
        }

        String nowStr = LocalDateTime.now().format(DTIME_FORMATTER);
        if (newEndDateTime.compareTo(nowStr) <= 0) {
            throw new IllegalArgumentException("과거 시간대에는 예약할 수 없습니다.");
        }

        // 합주방 유효성 및 소속 권한 확인
        BnGroup group = bnGroupRepository.findById(dto.getBnNo())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 합주방입니다."));

        if (!dto.getCnNo().equals(group.getCnNo())) {
            throw new IllegalArgumentException("해당 클랜에 소속된 합주방이 아닙니다.");
        }
        if (!"A".equals(group.getBnStatCd()) || (!"N".equals(group.getBnConfFg()) && !"Y".equals(group.getBnConfFg()))) {
            throw new IllegalArgumentException("진행 중이거나 확정된 합주방만 동아리방을 예약할 수 있습니다.");
        }

        BnUserId bnUserId = new BnUserId(group.getBnNo(), userId);
        BnUser bnUser = bnUserRepository.findById(bnUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 합주방의 멤버만 예약할 수 있습니다."));
        if (!"A".equals(bnUser.getBnUserStatCd())) {
            throw new IllegalArgumentException("활성화된 멤버만 예약할 수 있습니다.");
        }

        // [동시성 방어] 저장 직전 트랜잭션 내에서 중복 시간대 실시간 검증
        List<CnRoomSchedule> overlapping = cnRoomScheduleRepository.findOverlappingSchedules(
                dto.getCnNo(), newStartDateTime, newEndDateTime);

        if (!overlapping.isEmpty()) {
            throw new IllegalStateException("선택하신 시간대에 이미 다른 합주방의 예약이 존재합니다. 최신 예약 현황을 다시 확인해 주세요.");
        }

        CnRoomSchedule schedule = new CnRoomSchedule();
        schedule.setCnNo(dto.getCnNo());
        schedule.setBnNo(dto.getBnNo());
        schedule.setSchSttDate(dto.getSchSttDate());
        schedule.setSchSttTime(sttTime);
        schedule.setSchEndDate(dto.getSchEndDate());
        schedule.setSchEndTime(endTime);
        schedule.setSchStatCd("A");
        schedule.setInsDtime(nowStr);
        schedule.setInsId(userId);
        schedule.setUpdDtime(nowStr);
        schedule.setUpdId(userId);

        CnRoomSchedule saved = cnRoomScheduleRepository.save(schedule);

        User creator = userRepository.findById(userId).orElse(null);
        String groupImg = null;
        if (group.getAttachNo() != null) {
            groupImg = cmAttachmentRepository.findById(group.getAttachNo())
                    .map(CmAttachment::getFilePath).orElse(null);
        }

        return CnRoomScheduleDto.builder()
                .cnSchNo(saved.getCnSchNo())
                .cnNo(saved.getCnNo())
                .bnNo(saved.getBnNo())
                .bnNm(group.getBnNm())
                .bnSongNm(group.getBnSongNm())
                .bnSingerNm(group.getBnSingerNm())
                .bnImg(groupImg)
                .schSttDate(saved.getSchSttDate())
                .schSttTime(saved.getSchSttTime())
                .schEndDate(saved.getSchEndDate())
                .schEndTime(saved.getSchEndTime())
                .schStatCd(saved.getSchStatCd())
                .insDtime(saved.getInsDtime())
                .insId(saved.getInsId())
                .userNickNm(creator != null ? creator.getUserNickNm() : userId)
                .canDelete(true)
                .build();
    }

    /**
     * 동아리방 예약 삭제 (현재 시점 이후의 예약만 삭제 가능)
     */
    @Transactional
    public void deleteSchedule(Long cnSchNo, String userId) {
        CnRoomSchedule schedule = cnRoomScheduleRepository.findById(cnSchNo)
                .orElseThrow(() -> new IllegalArgumentException("해당 예약을 찾을 수 없습니다."));

        if (!"A".equals(schedule.getSchStatCd())) {
            throw new IllegalArgumentException("이미 취소되었거나 삭제된 예약입니다.");
        }

        String nowStr = LocalDateTime.now().format(DTIME_FORMATTER);
        String scheduleStartDateTime = normalizeDateTime(schedule.getSchSttDate(), schedule.getSchSttTime());

        if (scheduleStartDateTime.compareTo(nowStr) <= 0) {
            throw new IllegalStateException("현재 시점 이전이거나 이미 시작된 예약은 삭제할 수 없습니다.");
        }

        // 등록자 본인 검증
        if (!schedule.getInsId().equals(userId)) {
            throw new IllegalArgumentException("예약을 등록한 사용자 본인만 취소할 수 있습니다.");
        }

        schedule.setSchStatCd("D");
        schedule.setUpdDtime(nowStr);
        schedule.setUpdId(userId);

        cnRoomScheduleRepository.save(schedule);
    }

    private String padTime(String time) {
        if (time == null) return "000000";
        String clean = time.replaceAll("[^0-9]", "");
        if (clean.length() == 4) return clean + "00";
        if (clean.length() == 6) return clean;
        return String.format("%-6s", clean).replace(' ', '0');
    }

    private String normalizeDateTime(String date, String time) {
        return (date != null ? date : "") + padTime(time);
    }
}
