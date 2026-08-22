package com.bandi.backend.service;

import com.bandi.backend.entity.band.BnPartner;
import com.bandi.backend.repository.BnPartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPartnerService {

    private final BnPartnerRepository partnerRepository;
    private final PushService pushService;

    @Transactional(readOnly = true)
    public List<BnPartner> getPartnersForAdmin() {
        // R, A, B 상태를 포함한 전체 파트너 신청 목록 조회
        List<BnPartner> allList = partnerRepository.findAll();
        if (allList == null || allList.isEmpty()) {
            return new ArrayList<>();
        }

        // 최신 생성순(partnerNo 역순)으로 정렬
        allList.sort((o1, o2) -> {
            Long p1 = o1.getPartnerNo() != null ? o1.getPartnerNo() : 0L;
            Long p2 = o2.getPartnerNo() != null ? o2.getPartnerNo() : 0L;
            return p2.compareTo(p1);
        });

        // 사업자번호(bizRegNo) 기준 최신 1건만 취합 (동일 사업자번호 중복 신청 시 최신 상태 1개만 노출)
        Map<String, BnPartner> latestByBizRegNo = new LinkedHashMap<>();
        for (BnPartner p : allList) {
            String key = (p.getBizRegNo() != null && !p.getBizRegNo().isBlank()) 
                    ? p.getBizRegNo().trim() 
                    : ("ID_" + p.getPartnerNo());
            latestByBizRegNo.putIfAbsent(key, p);
        }

        List<BnPartner> result = new ArrayList<>(latestByBizRegNo.values());

        // 정렬: 심사대기('R') -> 승인완료('A') -> 심사거절('B') 순, 각각 최신 수정/신청일시 순
        result.sort((o1, o2) -> {
            int priority1 = getStatusPriority(o1.getPartnerStatCd());
            int priority2 = getStatusPriority(o2.getPartnerStatCd());
            if (priority1 != priority2) {
                return Integer.compare(priority1, priority2);
            }
            String dtime1 = o1.getUpdDtime() != null ? o1.getUpdDtime() : (o1.getInsDtime() != null ? o1.getInsDtime() : "");
            String dtime2 = o2.getUpdDtime() != null ? o2.getUpdDtime() : (o2.getInsDtime() != null ? o2.getInsDtime() : "");
            return dtime2.compareTo(dtime1);
        });

        return result;
    }

    private int getStatusPriority(String statCd) {
        if ("R".equals(statCd)) return 1;
        if ("A".equals(statCd)) return 2;
        if ("B".equals(statCd)) return 3;
        return 4;
    }

    @Transactional
    public BnPartner updatePartnerStatus(Long partnerNo, String status, String adminUserId) {
        BnPartner partner = partnerRepository.findById(partnerNo)
                .orElseThrow(() -> new RuntimeException("Partner registration info not found for No: " + partnerNo));

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        partner.setPartnerStatCd(status);
        partner.setUpdDtime(now);
        partner.setUpdId(adminUserId);

        BnPartner saved = partnerRepository.save(partner);

        // 푸시 발송: 입점 신청 담당자에게 결과 알림
        try {
            String title = "합주실 입점 신청 심사 결과";
            String body = "합주실 입점 신청이 " + ("A".equals(status) ? "승인" : "반려") + "되었습니다.";
            pushService.sendPush(
                partner.getUserId(),
                title,
                body,
                "/main/profile",
                "PARTNER_RESULT",
                "PARTNER"
            );
        } catch (Exception e) {
            log.error("Failed to send partner approval result push to user", e);
        }

        return saved;
    }
}
