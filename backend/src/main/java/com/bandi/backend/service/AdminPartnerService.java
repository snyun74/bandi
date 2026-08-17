package com.bandi.backend.service;

import com.bandi.backend.entity.band.BnPartner;
import com.bandi.backend.repository.BnPartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPartnerService {

    private final BnPartnerRepository partnerRepository;
    private final PushService pushService;

    @Transactional(readOnly = true)
    public List<BnPartner> getPartnersForAdmin() {
        List<BnPartner> list = partnerRepository.findByPartnerStatCdIn(List.of("R", "A"));
        list.sort((o1, o2) -> {
            boolean r1 = "R".equals(o1.getPartnerStatCd());
            boolean r2 = "R".equals(o2.getPartnerStatCd());
            if (r1 && !r2) return -1;
            if (!r1 && r2) return 1;
            String dtime1 = o1.getUpdDtime() != null ? o1.getUpdDtime() : o1.getInsDtime();
            String dtime2 = o2.getUpdDtime() != null ? o2.getUpdDtime() : o2.getInsDtime();
            if (dtime1 == null) dtime1 = "";
            if (dtime2 == null) dtime2 = "";
            return dtime2.compareTo(dtime1);
        });
        return list;
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
