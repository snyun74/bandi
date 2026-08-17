package com.bandi.backend.service;

import com.bandi.backend.entity.band.BnAmbassador;
import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.BnAmbassadorRepository;
import com.bandi.backend.repository.CommDetailRepository;
import com.bandi.backend.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAmbassadorService {

    private final BnAmbassadorRepository ambassadorRepository;
    private final UserRepository userRepository;
    private final CommDetailRepository commDetailRepository;

    private static final DateTimeFormatter DTIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private String nowDtime() {
        return LocalDateTime.now().format(DTIME_FORMATTER);
    }

    @Transactional(readOnly = true)
    public long getPendingCount() {
        return ambassadorRepository.findAll().stream()
                .filter(a -> "R".equals(a.getApplyStatCd()))
                .count();
    }

    @Transactional(readOnly = true)
    public List<AdminAmbassadorDto> getAllAmbassadorsForAdmin() {
        List<BnAmbassador> allList = ambassadorRepository.findAll();
        List<CommDetail> bd900List = commDetailRepository.findActiveDetailsByCommCd("BD900");
        Map<String, String> fieldNameMap = bd900List.stream()
                .collect(Collectors.toMap(CommDetail::getCommDtlCd, CommDetail::getCommDtlNm, (v1, v2) -> v1));

        String oneMonthAgoStr = LocalDateTime.now().minusDays(30).format(DTIME_FORMATTER);

        List<AdminAmbassadorDto> result = new ArrayList<>();

        for (BnAmbassador a : allList) {
            String stat = a.getApplyStatCd();

            // 거절(J)인 경우: 거절일시(reviewDtime or updDtime or insDtime)가 1달(30일) 이내인 건만 노출
            if ("J".equals(stat)) {
                String checkDtime = a.getReviewDtime() != null ? a.getReviewDtime()
                        : (a.getUpdDtime() != null ? a.getUpdDtime() : a.getInsDtime());
                if (checkDtime != null && checkDtime.compareTo(oneMonthAgoStr) < 0) {
                    continue; // 1달 지난 거절 건은 제외
                }
            }

            User user = userRepository.findByUserId(a.getUserId());
            String fieldNm = fieldNameMap.getOrDefault(a.getActivityField(), a.getActivityField());

            result.add(AdminAmbassadorDto.builder()
                    .userId(a.getUserId())
                    .userNm(user != null ? user.getUserNm() : "")
                    .userNickNm(user != null ? user.getUserNickNm() : "")
                    .phoneNo(user != null ? user.getPhoneNo() : "")
                    .activityField(a.getActivityField())
                    .activityFieldNm(fieldNm)
                    .introContent(a.getIntroContent())
                    .portfolioUrl(a.getPortfolioUrl())
                    .snsUrl(a.getSnsUrl())
                    .attachNo(a.getAttachNo())
                    .applyStatCd(a.getApplyStatCd())
                    .rejectReason(a.getRejectReason())
                    .reviewDtime(a.getReviewDtime())
                    .reviewId(a.getReviewId())
                    .insDtime(a.getInsDtime())
                    .updDtime(a.getUpdDtime())
                    .build());
        }

        // 정렬 규칙:
        // 1. 신청(R)이 맨 위 (최신 insDtime 내림차순)
        // 2. 승인(A)이 그 다음 (최신 reviewDtime or insDtime 내림차순)
        // 3. 거절(J)이 그 뒤 (최신 reviewDtime or insDtime 내림차순)
        result.sort((o1, o2) -> {
            int priority1 = getStatusPriority(o1.getApplyStatCd());
            int priority2 = getStatusPriority(o2.getApplyStatCd());

            if (priority1 != priority2) {
                return Integer.compare(priority1, priority2);
            }

            // 같은 상태 내에서는 최신 일시 내림차순
            String dtime1 = o1.getReviewDtime() != null ? o1.getReviewDtime() : o1.getInsDtime();
            String dtime2 = o2.getReviewDtime() != null ? o2.getReviewDtime() : o2.getInsDtime();
            if (dtime1 == null) dtime1 = "";
            if (dtime2 == null) dtime2 = "";
            return dtime2.compareTo(dtime1);
        });

        return result;
    }

    private int getStatusPriority(String stat) {
        if ("R".equals(stat)) return 1; // 1순위: 신청대기
        if ("A".equals(stat)) return 2; // 2순위: 승인완료
        if ("J".equals(stat)) return 3; // 3순위: 거절
        return 4;
    }

    @Transactional
    public BnAmbassador updateAmbassadorStatus(String targetUserId, String status, String rejectReason, String adminUserId) {
        BnAmbassador ambassador = ambassadorRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new RuntimeException("해당 엠버서더 신청 정보를 찾을 수 없습니다: " + targetUserId));

        String now = nowDtime();
        ambassador.setApplyStatCd(status);
        ambassador.setReviewDtime(now);
        ambassador.setReviewId(adminUserId);
        if ("J".equals(status)) {
            ambassador.setRejectReason(rejectReason);
        } else if ("A".equals(status)) {
            ambassador.setRejectReason(null);
        }
        ambassador.setUpdDtime(now);
        ambassador.setUpdId(adminUserId);

        return ambassadorRepository.save(ambassador);
    }

    @Data
    @Builder
    public static class AdminAmbassadorDto {
        private String userId;
        private String userNm;
        private String userNickNm;
        private String phoneNo;
        private String activityField;
        private String activityFieldNm;
        private String introContent;
        private String portfolioUrl;
        private String snsUrl;
        private Long attachNo;
        private String applyStatCd;
        private String rejectReason;
        private String reviewDtime;
        private String reviewId;
        private String insDtime;
        private String updDtime;
    }
}
