package com.bandi.backend.service;

import com.bandi.backend.entity.band.*;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerService {

    private final BnPartnerRepository partnerRepository;
    private final BnStudioRepository studioRepository;
    private final BnRoomRepository roomRepository;
    private final BnRoomPriceRepository roomPriceRepository;
    private final BnReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PushService pushService;

    // --- Partner status / application ---

    @Transactional(readOnly = true)
    public BnPartner getPartnerStatus(String userId) {
        return partnerRepository.findFirstByUserIdOrderByInsDtimeDesc(userId).orElse(null);
    }

    @Transactional
    public BnPartner applyPartner(BnPartner applyData) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        applyData.setPartnerStatCd("R"); // R: 요청(신청/대기)
        applyData.setInsDtime(now);
        applyData.setUpdDtime(now);
        applyData.setUpdId(applyData.getUserId());
        applyData.setInsId(applyData.getUserId());

        BnPartner saved = partnerRepository.save(applyData);

        // 푸시 발송: 관리자(admin_yn = 'Y') 전원에게 알림
        try {
            List<User> admins = userRepository.findByAdminYn("Y");
            for (User admin : admins) {
                pushService.sendPush(
                    admin.getUserId(),
                    "합주실 입점 신청 알림",
                    applyData.getBizNm() + "에서 입점 신청을 등록했습니다. 승인 검토 부탁드립니다.",
                    "/main/admin/partner-approval",
                    "PARTNER_REQ",
                    "PARTNER"
                );
            }
        } catch (Exception e) {
            log.error("Failed to send partner registration push to admins", e);
        }

        return saved;
    }

    // --- Studio Management ---

    @Transactional(readOnly = true)
    public List<BnStudio> getStudios(Long partnerNo) {
        return studioRepository.findByPartnerNoOrderByInsDtimeDesc(partnerNo);
    }

    @Transactional
    public BnStudio saveStudio(BnStudio studio, String userId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        if (studio.getStudioNo() == null) {
            studio.setStudioStatCd("A"); // A: 승인(사용중)
            studio.setInsDtime(now);
            studio.setInsId(userId);
        }
        studio.setUpdDtime(now);
        studio.setUpdId(userId);
        return studioRepository.save(studio);
    }

    // --- Room Management ---

    @Transactional(readOnly = true)
    public List<BnRoom> getRooms(Long studioNo) {
        return roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
    }

    @Transactional
    public BnRoom saveRoom(BnRoom room, String userId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        if (room.getRoomNo() == null) {
            room.setRoomStatCd("A"); // A: 승인(사용중)
            room.setInsDtime(now);
            room.setInsId(userId);
        }
        room.setUpdDtime(now);
        room.setUpdId(userId);
        return roomRepository.save(room);
    }

    // --- Price Management ---

    @Transactional(readOnly = true)
    public List<BnRoomPrice> getRoomPrices(Long roomNo) {
        return roomPriceRepository.findByRoomNoOrderByDayOfWeekAscSttTimeAsc(roomNo);
    }

    @Transactional
    public List<BnRoomPrice> saveRoomPrices(Long roomNo, List<BnRoomPrice> prices, String userId) {
        // 기존 가격 데이터 삭제 후 전체 일괄 재등록
        roomPriceRepository.deleteByRoomNo(roomNo);

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        for (BnRoomPrice price : prices) {
            price.setPriceNo(null);
            price.setRoomNo(roomNo);
            price.setPriceStatCd("A"); // A: 승인(사용중)
            price.setInsDtime(now);
            price.setInsId(userId);
            price.setUpdDtime(now);
            price.setUpdId(userId);
        }
        return roomPriceRepository.saveAll(prices);
    }

    // --- Reservation Approvals (Partner Perspective) ---

    @Transactional(readOnly = true)
    public List<PartnerReservationDto> getReservationsForPartner(Long partnerNo) {
        List<BnStudio> studios = studioRepository.findByPartnerNoOrderByInsDtimeDesc(partnerNo);
        List<Long> studioNos = studios.stream().map(BnStudio::getStudioNo).collect(Collectors.toList());
        if (studioNos.isEmpty()) return new ArrayList<>();

        List<BnRoom> rooms = new ArrayList<>();
        for (Long sNo : studioNos) {
            rooms.addAll(roomRepository.findByStudioNoOrderByInsDtimeDesc(sNo));
        }
        List<Long> roomNos = rooms.stream().map(BnRoom::getRoomNo).collect(Collectors.toList());
        if (roomNos.isEmpty()) return new ArrayList<>();

        List<BnReservation> reservations = reservationRepository.findByRoomNoInOrderByInsDtimeDesc(roomNos);
        List<PartnerReservationDto> dtos = new ArrayList<>();

        for (BnReservation resv : reservations) {
            BnRoom room = rooms.stream().filter(r -> r.getRoomNo().equals(resv.getRoomNo())).findFirst().orElse(null);
            BnStudio studio = null;
            if (room != null) {
                studio = studios.stream().filter(s -> s.getStudioNo().equals(room.getStudioNo())).findFirst().orElse(null);
            }
            User user = userRepository.findByUserId(resv.getUserId());

            dtos.add(PartnerReservationDto.builder()
                    .resvNo(resv.getResvNo())
                    .roomNo(resv.getRoomNo())
                    .roomNm(room != null ? room.getRoomNm() : "알수없음")
                    .studioNm(studio != null ? studio.getStudioNm() : "알수없음")
                    .userId(resv.getUserId())
                    .userNm(user != null ? user.getUserNm() : "알수없음")
                    .userNickNm(user != null ? user.getUserNickNm() : "알수없음")
                    .useDate(resv.getUseDate())
                    .sttTime(resv.getSttTime())
                    .endTime(resv.getEndTime())
                    .resvTotAmt(resv.getResvTotAmt())
                    .paymentAmt(resv.getPaymentAmt())
                    .paymentStatFg(resv.getPaymentStatFg())
                    .resvStatFg(resv.getResvStatFg())
                    .resvRejectBigo(resv.getResvRejectBigo())
                    .insDtime(resv.getInsDtime())
                    .build());
        }

        return dtos;
    }

    @Transactional
    public BnReservation updateReservationStatus(Long resvNo, String status, String rejectBigo, String userId) {
        BnReservation resv = reservationRepository.findById(resvNo)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + resvNo));

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        resv.setResvStatFg(status);
        if ("REJ".equals(status)) {
            resv.setResvRejectBigo(rejectBigo);
        }
        resv.setUpdDtime(now);
        resv.setUpdId(userId);

        BnReservation saved = reservationRepository.save(resv);

        // 푸시 발송: 예약자(resv.getUserId())에게 승인/반려 알림 발송
        try {
            String title = "합주실 예약 결과 안내";
            String body = "합주실 예약이 " + ("APR".equals(status) ? "승인" : "거절") + "되었습니다.";
            if ("REJ".equals(status) && rejectBigo != null && !rejectBigo.trim().isEmpty()) {
                body += " (사유: " + rejectBigo + ")";
            }
            pushService.sendPush(
                resv.getUserId(),
                title,
                body,
                "/main/profile",
                "RESV_RESULT",
                "RESERVATION"
            );
        } catch (Exception e) {
            log.error("Failed to send reservation update push to user", e);
        }

        return saved;
    }

    // DTO Class definition
    @lombok.Data
    @lombok.Builder
    public static class PartnerReservationDto {
        private Long resvNo;
        private Long roomNo;
        private String roomNm;
        private String studioNm;
        private String userId;
        private String userNm;
        private String userNickNm;
        private String useDate;
        private String sttTime;
        private String endTime;
        private Integer resvTotAmt;
        private Integer paymentAmt;
        private String paymentStatFg;
        private String resvStatFg;
        private String resvRejectBigo;
        private String insDtime;
    }

    // --- User-facing: Public Studio/Room Browse ---

    @Transactional(readOnly = true)
    public List<BnStudio> getAllActiveStudios() {
        return studioRepository.findByStudioStatCdOrderByInsDtimeDesc("A");
    }

    @Transactional(readOnly = true)
    public List<BnRoom> getRoomsByStudio(Long studioNo) {
        return roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
    }

    @Transactional(readOnly = true)
    public List<BnRoomPrice> getPricesByRoom(Long roomNo) {
        return roomPriceRepository.findByRoomNoOrderByDayOfWeekAscSttTimeAsc(roomNo);
    }

    @Transactional(readOnly = true)
    public List<BnReservation> getReservedSlots(Long roomNo, String useDate) {
        return reservationRepository.findByRoomNoAndUseDateOrderBySttTimeAsc(roomNo, useDate);
    }

    // --- User-facing: Reservation ---

    @Transactional
    public BnReservation createReservation(BnReservation resv, String userId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        resv.setUserId(userId);
        resv.setResvStatFg("REQ");       // 예약 대기
        resv.setPaymentStatFg("WAIT");   // 결제 대기
        resv.setInsDtime(now);
        resv.setInsId(userId);
        resv.setUpdDtime(now);
        resv.setUpdId(userId);

        BnReservation saved = reservationRepository.save(resv);

        // 파트너에게 예약 알림 발송
        try {
            BnRoom room = roomRepository.findById(resv.getRoomNo()).orElse(null);
            if (room != null) {
                BnStudio studio = studioRepository.findById(room.getStudioNo()).orElse(null);
                if (studio != null) {
                    BnPartner partner = partnerRepository.findById(studio.getPartnerNo()).orElse(null);
                    if (partner != null) {
                        pushService.sendPush(
                            partner.getUserId(),
                            "새 예약 신청 알림",
                            studio.getStudioNm() + " - " + room.getRoomNm() + " 예약 신청이 접수되었습니다.",
                            "/main/partner/manage",
                            "RESV_REQ",
                            "RESERVATION"
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to send reservation request push to partner", e);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<UserReservationDto> getMyReservations(String userId) {
        List<BnReservation> reservations = reservationRepository.findByUserIdOrderByInsDtimeDesc(userId);
        List<UserReservationDto> dtos = new ArrayList<>();

        for (BnReservation resv : reservations) {
            BnRoom room = roomRepository.findById(resv.getRoomNo()).orElse(null);
            BnStudio studio = null;
            if (room != null) {
                studio = studioRepository.findById(room.getStudioNo()).orElse(null);
            }
            dtos.add(UserReservationDto.builder()
                    .resvNo(resv.getResvNo())
                    .roomNo(resv.getRoomNo())
                    .roomNm(room != null ? room.getRoomNm() : "알수없음")
                    .studioNm(studio != null ? studio.getStudioNm() : "알수없음")
                    .useDate(resv.getUseDate())
                    .sttTime(resv.getSttTime())
                    .endTime(resv.getEndTime())
                    .resvTotAmt(resv.getResvTotAmt())
                    .paymentAmt(resv.getPaymentAmt())
                    .resvStatFg(resv.getResvStatFg())
                    .resvRejectBigo(resv.getResvRejectBigo())
                    .insDtime(resv.getInsDtime())
                    .build());
        }
        return dtos;
    }

    @Transactional
    public BnReservation cancelReservation(Long resvNo, String userId) {
        BnReservation resv = reservationRepository.findById(resvNo)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + resvNo));
        if (!resv.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized: not your reservation");
        }
        if (!"REQ".equals(resv.getResvStatFg())) {
            throw new RuntimeException("Cannot cancel: reservation is already " + resv.getResvStatFg());
        }
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        resv.setResvStatFg("CAN");
        resv.setUpdDtime(now);
        resv.setUpdId(userId);
        return reservationRepository.save(resv);
    }

    // User-facing DTO
    @lombok.Data
    @lombok.Builder
    public static class UserReservationDto {
        private Long resvNo;
        private Long roomNo;
        private String roomNm;
        private String studioNm;
        private String useDate;
        private String sttTime;
        private String endTime;
        private Integer resvTotAmt;
        private Integer paymentAmt;
        private String resvStatFg;
        private String resvRejectBigo;
        private String insDtime;
    }
}
