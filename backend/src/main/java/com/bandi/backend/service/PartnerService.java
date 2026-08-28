package com.bandi.backend.service;

import com.bandi.backend.entity.band.*;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.repository.*;
import com.bandi.backend.utils.FileStorageUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.bandi.backend.enums.FileCategory;
import com.bandi.backend.dto.UploadFileResultDto;

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

    private final CmAttachmentRepository cmAttachmentRepository;
    private final BnStudioAttachmentRepository studioAttachmentRepository;
    private final BnRoomAttachmentRepository roomAttachmentRepository;
    private final FileStorageService fileStorageService;
    private final JamChatService jamChatService;

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

    @Transactional
    public BnPartner updatePartnerInfo(BnPartner updateData, String userId) {
        BnPartner partner = partnerRepository.findById(updateData.getPartnerNo())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 파트너 정보입니다."));

        if (!partner.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 입점사 정보만 수정할 수 있습니다.");
        }

        // 사업자번호(bizRegNo)와 사업자명(bizNm)은 수정 불가하여 기존 값 유지
        partner.setBizMasterNm(updateData.getBizMasterNm());
        partner.setBizTelNo(updateData.getBizTelNo());
        partner.setBizHpNo(updateData.getBizHpNo());
        partner.setBankNm(updateData.getBankNm());
        partner.setAccountNo(updateData.getAccountNo());
        partner.setAccountHolderNm(updateData.getAccountHolderNm());

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        partner.setUpdDtime(now);
        partner.setUpdId(userId);

        return partnerRepository.save(partner);
    }

    // --- DTO Definitions for Studio & Room with Attachments ---
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class AttachmentDto {
        private Long attachNo;
        private String filePath;
        private String fileName;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class StudioDto {
        private Long studioNo;
        private Long partnerNo;
        private String studioNm;
        private String address;
        private String zipcode;
        private String bigo;
        private String studioStatCd;
        private String insDtime;
        private String insId;
        private String updDtime;
        private String updId;
        private List<AttachmentDto> attachments;
        private Integer lowestPrice;
        private Integer originalLowestPrice;
        private Integer discountRate;
        private String roomSummary;
        private String studioTypeCd;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class RoomDto {
        private Long roomNo;
        private Long studioNo;
        private String roomNm;
        private Integer hourBaseUprice;
        private Integer currentUprice;
        private Integer discountRate;
        private Integer capacityCnt;
        private String equipmentInfo;
        private String roomStatCd;
        private String insDtime;
        private String insId;
        private String updDtime;
        private String updId;
        private List<AttachmentDto> attachments;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class StudioDetailDto {
        private Long studioNo;
        private Long partnerNo;
        private String studioNm;
        private String address;
        private String zipcode;
        private String bigo;
        private String studioStatCd;
        private String studioTypeCd;
        private String insDtime;
        private String bankNm;
        private String accountNo;
        private String accountHolderNm;
        private List<AttachmentDto> attachments;
        private List<RoomDto> rooms;
    }

    // --- Studio Management ---

    @Transactional(readOnly = true)
    public List<StudioDto> getStudiosWithAttachments(Long partnerNo) {
        try {
            List<BnStudio> studios = studioRepository.findByPartnerNoOrderByInsDtimeDesc(partnerNo);
            List<StudioDto> result = new ArrayList<>();
            if (studios == null) return result;

            for (BnStudio s : studios) {
                List<AttachmentDto> attachments = new ArrayList<>();
                try {
                    List<BnStudioAttachment> studioAttaches = studioAttachmentRepository.findByStudioNo(s.getStudioNo());
                    if (studioAttaches != null) {
                        attachments = studioAttaches.stream()
                                .map(att -> cmAttachmentRepository.findById(att.getAttachNo()).orElse(null))
                                .filter(cm -> cm != null)
                                .map(cm -> AttachmentDto.builder()
                                        .attachNo(cm.getAttachNo())
                                        .filePath(cm.getFilePath())
                                        .fileName(cm.getFileName())
                                        .build())
                                .collect(Collectors.toList());
                    }
                } catch (Exception e) {
                    log.error("Failed to load studio attachments for studioNo: {}", s.getStudioNo(), e);
                }

                result.add(StudioDto.builder()
                        .studioNo(s.getStudioNo())
                        .partnerNo(s.getPartnerNo())
                        .studioNm(s.getStudioNm())
                        .address(s.getAddress())
                        .zipcode(s.getZipcode())
                        .bigo(s.getBigo())
                        .studioStatCd(s.getStudioStatCd())
                        .insDtime(s.getInsDtime())
                        .insId(s.getInsId())
                        .updDtime(s.getUpdDtime())
                        .updId(s.getUpdId())
                        .attachments(attachments)
                        .studioTypeCd(s.getStudioTypeCd())
                        .build());
            }
            return result;
        } catch (Exception e) {
            log.error("Error in getStudiosWithAttachments for partnerNo: {}", partnerNo, e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<BnStudio> getStudios(Long partnerNo) {
        return studioRepository.findByPartnerNoOrderByInsDtimeDesc(partnerNo);
    }

    @Transactional
    public BnStudio saveStudio(BnStudio studio, String userId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String validUserId = (userId != null && !userId.isBlank()) ? userId : "SYSTEM";
        if (studio.getStudioNo() == null) {
            studio.setStudioStatCd("A"); // A: 승인(사용중)
            studio.setInsDtime(now);
            studio.setInsId(validUserId);
        } else {
            Optional<BnStudio> existingOpt = studioRepository.findById(studio.getStudioNo());
            if (existingOpt.isPresent()) {
                BnStudio existing = existingOpt.get();
                existing.setStudioNm(studio.getStudioNm());
                existing.setAddress(studio.getAddress());
                existing.setZipcode(studio.getZipcode());
                existing.setBigo(studio.getBigo());
                if (studio.getStudioStatCd() != null) {
                    existing.setStudioStatCd(studio.getStudioStatCd());
                }
                if (studio.getStudioTypeCd() != null) {
                    existing.setStudioTypeCd(studio.getStudioTypeCd());
                }
                existing.setUpdDtime(now);
                existing.setUpdId(validUserId);
                return studioRepository.save(existing);
            }
        }
        studio.setUpdDtime(now);
        studio.setUpdId(validUserId);
        return studioRepository.save(studio);
    }

    @Transactional
    public StudioDto saveStudioWithImages(BnStudio studioParam, List<MultipartFile> files, List<Long> deleteAttachNos, String userId) {
        BnStudio savedStudio = saveStudio(studioParam, userId);
        Long studioNo = savedStudio.getStudioNo();
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String validUserId = (userId != null && !userId.isBlank()) ? userId : "SYSTEM";

        if (deleteAttachNos != null && !deleteAttachNos.isEmpty()) {
            for (Long delNo : deleteAttachNos) {
                studioAttachmentRepository.deleteByStudioNoAndAttachNo(studioNo, delNo);
            }
        }

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                UploadFileResultDto uploadResult = fileStorageService.storeFile(file, FileCategory.ADMIN, validUserId);

                BnStudioAttachment studioAttachment = new BnStudioAttachment();
                studioAttachment.setStudioNo(studioNo);
                studioAttachment.setAttachNo(uploadResult.getAttachNo());
                studioAttachment.setAttachStatCd("A");
                studioAttachment.setInsDtime(now);
                studioAttachment.setInsId(validUserId);
                studioAttachment.setUpdDtime(now);
                studioAttachment.setUpdId(validUserId);
                studioAttachmentRepository.save(studioAttachment);
            }
        }

        return getStudiosWithAttachments(savedStudio.getPartnerNo()).stream()
                .filter(s -> s.getStudioNo().equals(studioNo))
                .findFirst().orElse(null);
    }

    // --- Room Management ---

    @Transactional(readOnly = true)
    public List<RoomDto> getRoomsWithAttachments(Long studioNo) {
        try {
            List<BnRoom> rooms = roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
            List<RoomDto> result = new ArrayList<>();
            if (rooms == null) return result;

            for (BnRoom r : rooms) {
                List<AttachmentDto> attachments = new ArrayList<>();
                try {
                    List<BnRoomAttachment> roomAttaches = roomAttachmentRepository.findByRoomNo(r.getRoomNo());
                    if (roomAttaches != null) {
                        attachments = roomAttaches.stream()
                                .map(att -> cmAttachmentRepository.findById(att.getAttachNo()).orElse(null))
                                .filter(cm -> cm != null)
                                .map(cm -> AttachmentDto.builder()
                                        .attachNo(cm.getAttachNo())
                                        .filePath(cm.getFilePath())
                                        .fileName(cm.getFileName())
                                        .build())
                                .collect(Collectors.toList());
                    }
                } catch (Exception e) {
                    log.error("Failed to load room attachments for roomNo: {}", r.getRoomNo(), e);
                }

                result.add(RoomDto.builder()
                        .roomNo(r.getRoomNo())
                        .studioNo(r.getStudioNo())
                        .roomNm(r.getRoomNm())
                        .hourBaseUprice(r.getHourBaseUprice())
                        .capacityCnt(r.getCapacityCnt())
                        .equipmentInfo(r.getEquipmentInfo())
                        .roomStatCd(r.getRoomStatCd())
                        .insDtime(r.getInsDtime())
                        .insId(r.getInsId())
                        .updDtime(r.getUpdDtime())
                        .updId(r.getUpdId())
                        .attachments(attachments)
                        .build());
            }
            return result;
        } catch (Exception e) {
            log.error("Error in getRoomsWithAttachments for studioNo: {}", studioNo, e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<BnRoom> getRooms(Long studioNo) {
        return roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
    }

    @Transactional
    public BnRoom saveRoom(BnRoom room, String userId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String validUserId = (userId != null && !userId.isBlank()) ? userId : "SYSTEM";
        if (room.getRoomNo() == null) {
            room.setRoomStatCd("A"); // A: 승인(사용중)
            room.setInsDtime(now);
            room.setInsId(validUserId);
        } else {
            Optional<BnRoom> existingOpt = roomRepository.findById(room.getRoomNo());
            if (existingOpt.isPresent()) {
                BnRoom existing = existingOpt.get();
                existing.setRoomNm(room.getRoomNm());
                existing.setHourBaseUprice(room.getHourBaseUprice());
                existing.setCapacityCnt(room.getCapacityCnt());
                existing.setEquipmentInfo(room.getEquipmentInfo());
                if (room.getRoomStatCd() != null) {
                    existing.setRoomStatCd(room.getRoomStatCd());
                }
                existing.setUpdDtime(now);
                existing.setUpdId(validUserId);
                return roomRepository.save(existing);
            }
        }
        room.setUpdDtime(now);
        room.setUpdId(validUserId);
        return roomRepository.save(room);
    }

    @Transactional
    public RoomDto saveRoomWithImages(BnRoom roomParam, List<MultipartFile> files, List<Long> deleteAttachNos, String userId) {
        BnRoom savedRoom = saveRoom(roomParam, userId);
        Long roomNo = savedRoom.getRoomNo();
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String validUserId = (userId != null && !userId.isBlank()) ? userId : "SYSTEM";

        if (deleteAttachNos != null && !deleteAttachNos.isEmpty()) {
            for (Long delNo : deleteAttachNos) {
                roomAttachmentRepository.deleteByRoomNoAndAttachNo(roomNo, delNo);
            }
        }

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                UploadFileResultDto uploadResult = fileStorageService.storeFile(file, FileCategory.ADMIN, validUserId);

                BnRoomAttachment roomAttachment = new BnRoomAttachment();
                roomAttachment.setRoomNo(roomNo);
                roomAttachment.setAttachNo(uploadResult.getAttachNo());
                roomAttachment.setAttachStatCd("A");
                roomAttachment.setInsDtime(now);
                roomAttachment.setInsId(validUserId);
                roomAttachment.setUpdDtime(now);
                roomAttachment.setUpdId(validUserId);
                roomAttachmentRepository.save(roomAttachment);
            }
        }

        return getRoomsWithAttachments(savedRoom.getStudioNo()).stream()
                .filter(r -> r.getRoomNo().equals(roomNo))
                .findFirst().orElse(null);
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

        // 과거 31일 전 날짜 계산 (yyyyMMdd)
        String cutoffDate = LocalDateTime.now().minusDays(31).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        for (BnReservation resv : reservations) {
            // 과거 31일 이전 자료는 제외 (31일 전 ~ 미래 자료만 포함)
            if (resv.getUseDate() != null && resv.getUseDate().compareTo(cutoffDate) < 0) {
                continue;
            }

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
                    .phoneNo(user != null ? user.getPhoneNo() : "")
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

        // 정렬 순서 적용:
        // 1. 신청 상태('REQ') 자료를 최상단에 배치 (REQ 내에서는 최신 신청일시 순)
        // 2. 승인/거절 완료 자료는 합주일자(useDate) 및 시작시간(sttTime) 최근순(내림차순) 배치
        dtos.sort((a, b) -> {
            boolean aIsReq = "REQ".equals(a.getResvStatFg());
            boolean bIsReq = "REQ".equals(b.getResvStatFg());

            if (aIsReq && !bIsReq) return -1;
            if (!aIsReq && bIsReq) return 1;

            if (aIsReq && bIsReq) {
                // 신청 건끼리는 신청일시(insDtime) 최신순
                String insA = a.getInsDtime() != null ? a.getInsDtime() : "";
                String insB = b.getInsDtime() != null ? b.getInsDtime() : "";
                return insB.compareTo(insA);
            }

            // 승인/거절 완료건은 합주일자(useDate) 최근순(내림차순)
            String dateA = a.getUseDate() != null ? a.getUseDate() : "";
            String dateB = b.getUseDate() != null ? b.getUseDate() : "";
            int dateCmp = dateB.compareTo(dateA);
            if (dateCmp != 0) return dateCmp;

            // 동일 일자일 경우 시작시간(sttTime) 최근순(내림차순)
            String timeA = a.getSttTime() != null ? a.getSttTime() : "";
            String timeB = b.getSttTime() != null ? b.getSttTime() : "";
            return timeB.compareTo(timeA);
        });

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
            boolean isApproved = !"REJ".equalsIgnoreCase(status) && !"CAN".equalsIgnoreCase(status);
            String title = "합주실 예약 결과 안내";
            String body = "합주실 예약이 " + (isApproved ? "승인" : "거절") + "되었습니다.";
            if (!isApproved && rejectBigo != null && !rejectBigo.trim().isEmpty()) {
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

        // 합주 단체채팅방에 예약 승인/거절 상태 메시지 자동 전송
        try {
            if (resv.getBnNo() != null) {
                BnRoom room = roomRepository.findById(resv.getRoomNo()).orElse(null);
                BnStudio studio = room != null ? studioRepository.findById(room.getStudioNo()).orElse(null) : null;
                String studioNm = studio != null ? studio.getStudioNm() : "합주실";
                String roomNm = room != null ? room.getRoomNm() : "";

                String cleanDate = resv.getUseDate() != null ? resv.getUseDate().replaceAll("[^0-9]", "") : "";
                String dateDisp = cleanDate.length() == 8
                        ? cleanDate.substring(0, 4) + "년 " + Integer.parseInt(cleanDate.substring(4, 6)) + "월 " + Integer.parseInt(cleanDate.substring(6, 8)) + "일"
                        : resv.getUseDate();

                String cleanStt = resv.getSttTime() != null ? resv.getSttTime().replaceAll("[^0-9]", "") : "";
                String cleanEnd = resv.getEndTime() != null ? resv.getEndTime().replaceAll("[^0-9]", "") : "";
                String timeDisp = (cleanStt.length() >= 2 ? cleanStt.substring(0, 2) + ":00" : "")
                        + "~" + (cleanEnd.length() >= 2 ? cleanEnd.substring(0, 2) + ":00" : "");

                boolean isApproved = !"REJ".equalsIgnoreCase(status) && !"CAN".equalsIgnoreCase(status);
                String chatMsg;

                if (isApproved) {
                    chatMsg = "🎸 [합주실 예약 승인 완료]\n"
                            + "📍 장소: " + studioNm + (roomNm.isEmpty() ? "" : " · " + roomNm) + "\n"
                            + "🗓️ 일시: " + dateDisp + " " + timeDisp + "\n\n"
                            + "합주실 예약이 파트너에 의해 최종 승인되었습니다! 🎶";
                } else {
                    chatMsg = "⚠️ [합주실 예약 거절 안내]\n"
                            + "📍 장소: " + studioNm + (roomNm.isEmpty() ? "" : " · " + roomNm) + "\n"
                            + "🗓️ 일시: " + dateDisp + " " + timeDisp + "\n"
                            + (rejectBigo != null && !rejectBigo.trim().isEmpty() ? "사유: " + rejectBigo.trim() + "\n\n" : "\n")
                            + "합주실 예약이 거절되었습니다. 다른 시간이나 공간을 확인해 주세요.";
                }

                jamChatService.saveMessage(com.bandi.backend.dto.ChatMessageCreateDto.builder()
                        .cnNo(resv.getBnNo())
                        .sndUserId(userId != null ? userId : "system")
                        .msg(chatMsg)
                        .msgTypeCd("TEXT")
                        .roomType("BAND")
                        .build());
                log.info("[updateReservationStatus] 단체채팅방 알림 전송 완료 - bnNo: {}, status: {}", resv.getBnNo(), status);
            }
        } catch (Exception e) {
            log.error("Failed to send reservation status update to jam chat", e);
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
        private String phoneNo;
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
    public StudioDetailDto getStudioDetail(Long studioNo) {
        BnStudio studio = studioRepository.findById(studioNo).orElse(null);
        if (studio == null || !"A".equals(studio.getStudioStatCd())) return null;

        BnPartner partner = null;
        if (studio.getPartnerNo() != null) {
            partner = partnerRepository.findById(studio.getPartnerNo()).orElse(null);
        }
        if (partner == null || !"A".equals(partner.getPartnerStatCd())) {
            return null; // 입점사가 승인('A') 상태가 아니면 조회 불가
        }

        // 지점 이미지 조회
        List<AttachmentDto> attachments = new ArrayList<>();
        try {
            List<BnStudioAttachment> studioAttaches = studioAttachmentRepository.findByStudioNo(studioNo);
            if (studioAttaches != null) {
                attachments = studioAttaches.stream()
                        .map(att -> cmAttachmentRepository.findById(att.getAttachNo()).orElse(null))
                        .filter(cm -> cm != null)
                        .map(cm -> AttachmentDto.builder()
                                .attachNo(cm.getAttachNo())
                                .filePath(cm.getFilePath())
                                .fileName(cm.getFileName())
                                .build())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Failed to load attachments for studioNo: {}", studioNo, e);
        }

        // 룸 목록 조회 (이미지 포함, 상태가 'A'인 룸만)
        List<RoomDto> roomDtos = new ArrayList<>();
        try {
            List<BnRoom> rooms = roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
            if (rooms != null) {
                for (BnRoom room : rooms) {
                    if (!"A".equals(room.getRoomStatCd())) {
                        continue; // 상태가 'A'가 아닌 룸은 제외
                    }
                    List<AttachmentDto> roomAttachments = new ArrayList<>();
                    try {
                        List<BnRoomAttachment> roomAttaches = roomAttachmentRepository.findByRoomNo(room.getRoomNo());
                        if (roomAttaches != null) {
                            roomAttachments = roomAttaches.stream()
                                    .map(att -> cmAttachmentRepository.findById(att.getAttachNo()).orElse(null))
                                    .filter(cm -> cm != null)
                                    .map(cm -> AttachmentDto.builder()
                                            .attachNo(cm.getAttachNo())
                                            .filePath(cm.getFilePath())
                                            .fileName(cm.getFileName())
                                            .build())
                                    .collect(Collectors.toList());
                        }
                    } catch (Exception e) {
                        log.error("Failed to load room attachments for roomNo: {}", room.getRoomNo(), e);
                    }

                    // 현재 요일/시간 기준 실시간 단가 및 할인율 계산
                    List<BnRoomPrice> prices = roomPriceRepository.findByRoomNoOrderByDayOfWeekAscSttTimeAsc(room.getRoomNo());
                    CurrentPriceInfo priceInfo = calculateCurrentPrice(room, prices);

                    roomDtos.add(RoomDto.builder()
                            .roomNo(room.getRoomNo())
                            .studioNo(room.getStudioNo())
                            .roomNm(room.getRoomNm())
                            .hourBaseUprice(room.getHourBaseUprice())
                            .currentUprice(priceInfo.currentUprice)
                            .discountRate(priceInfo.discountRate)
                            .capacityCnt(room.getCapacityCnt())
                            .equipmentInfo(room.getEquipmentInfo())
                            .roomStatCd(room.getRoomStatCd())
                            .insDtime(room.getInsDtime())
                            .insId(room.getInsId())
                            .attachments(roomAttachments)
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to load rooms for studioNo: {}", studioNo, e);
        }

        return StudioDetailDto.builder()
                .studioNo(studio.getStudioNo())
                .partnerNo(studio.getPartnerNo())
                .studioNm(studio.getStudioNm())
                .address(studio.getAddress())
                .zipcode(studio.getZipcode())
                .bigo(studio.getBigo())
                .studioStatCd(studio.getStudioStatCd())
                .studioTypeCd(studio.getStudioTypeCd())
                .insDtime(studio.getInsDtime())
                .bankNm(partner.getBankNm())
                .accountNo(partner.getAccountNo())
                .accountHolderNm(partner.getAccountHolderNm())
                .attachments(attachments)
                .rooms(roomDtos)
                .build();
    }

    @Getter
    @AllArgsConstructor
    public static class CurrentPriceInfo {
        private final Integer currentUprice;
        private final Integer discountRate;
    }

    private CurrentPriceInfo calculateCurrentPrice(BnRoom room, List<BnRoomPrice> prices) {
        Integer basePrice = room.getHourBaseUprice();
        if (prices == null || prices.isEmpty()) {
            return new CurrentPriceInfo(basePrice, 0);
        }

        LocalDateTime now = LocalDateTime.now();
        int currentDayOfWeek = now.getDayOfWeek().getValue() % 7; // 0=일, 1=월, ..., 6=토
        int currentTime = Integer.parseInt(now.format(DateTimeFormatter.ofPattern("HHmm")));

        Integer matchedPrice = null;
        for (BnRoomPrice p : prices) {
            if (p.getDayOfWeek() != null && p.getDayOfWeek() == currentDayOfWeek) {
                try {
                    String cleanStt = p.getSttTime() != null ? p.getSttTime().replaceAll("[^0-9]", "") : "";
                    String cleanEnd = p.getEndTime() != null ? p.getEndTime().replaceAll("[^0-9]", "") : "";
                    if (!cleanStt.isEmpty() && !cleanEnd.isEmpty()) {
                        int stt = Integer.parseInt(cleanStt);
                        int end = Integer.parseInt(cleanEnd);
                        if (currentTime >= stt && currentTime < end) {
                            matchedPrice = p.getTimeUprice();
                            break;
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        Integer currentUprice = matchedPrice != null ? matchedPrice : basePrice;
        int discountRate = 0;
        if (basePrice != null && basePrice > 0 && currentUprice != null && currentUprice < basePrice) {
            discountRate = Math.round((float) (basePrice - currentUprice) / basePrice * 100);
        }

        return new CurrentPriceInfo(currentUprice, discountRate);
    }

    @Transactional(readOnly = true)
    public List<StudioDto> getActiveStudiosWithDetails() {
        // 1. 승인된 입점사('A') 목록 조회
        List<BnPartner> activePartners = partnerRepository.findByPartnerStatCdOrderByInsDtimeDesc("A");
        if (activePartners == null || activePartners.isEmpty()) {
            return new ArrayList<>();
        }
        java.util.Set<Long> activePartnerNos = activePartners.stream()
                .map(BnPartner::getPartnerNo)
                .collect(Collectors.toSet());

        // 2. 사용중인 지점('A') 목록 조회
        List<BnStudio> studios = studioRepository.findByStudioStatCdOrderByInsDtimeDesc("A");
        List<StudioDto> result = new ArrayList<>();
        if (studios == null) return result;

        for (BnStudio s : studios) {
            // 입점사가 승인 상태('A')가 아니면 제외
            if (s.getPartnerNo() == null || !activePartnerNos.contains(s.getPartnerNo())) {
                continue;
            }

            List<AttachmentDto> attachments = new ArrayList<>();
            try {
                List<BnStudioAttachment> studioAttaches = studioAttachmentRepository.findByStudioNo(s.getStudioNo());
                if (studioAttaches != null) {
                    attachments = studioAttaches.stream()
                            .map(att -> cmAttachmentRepository.findById(att.getAttachNo()).orElse(null))
                            .filter(cm -> cm != null)
                            .map(cm -> AttachmentDto.builder()
                                    .attachNo(cm.getAttachNo())
                                    .filePath(cm.getFilePath())
                                    .fileName(cm.getFileName())
                                    .build())
                            .collect(Collectors.toList());
                }
            } catch (Exception e) {
                log.error("Failed to load attachments for studioNo: {}", s.getStudioNo(), e);
            }

            // 룸 최저가 및 요약 조회 (상태가 'A'인 룸만 반영, 현재 실시간 단가 및 할인율 반영)
            Integer lowestPrice = null;
            Integer originalLowestPrice = null;
            Integer discountRate = null;
            String roomSummary = "";
            try {
                List<BnRoom> rooms = roomRepository.findByStudioNoOrderByInsDtimeDesc(s.getStudioNo());
                if (rooms != null && !rooms.isEmpty()) {
                    List<BnRoom> activeRooms = rooms.stream()
                            .filter(r -> "A".equals(r.getRoomStatCd()))
                            .collect(Collectors.toList());

                    if (!activeRooms.isEmpty()) {
                        BnRoom bestRoom = null;
                        int minEffectivePrice = Integer.MAX_VALUE;
                        int bestDiscountRate = 0;
                        Integer bestOriginalPrice = null;

                        for (BnRoom r : activeRooms) {
                            List<BnRoomPrice> prices = roomPriceRepository.findByRoomNoOrderByDayOfWeekAscSttTimeAsc(r.getRoomNo());
                            CurrentPriceInfo priceInfo = calculateCurrentPrice(r, prices);
                            Integer effectivePrice = priceInfo.getCurrentUprice() != null ? priceInfo.getCurrentUprice() : r.getHourBaseUprice();
                            if (effectivePrice != null && effectivePrice < minEffectivePrice) {
                                minEffectivePrice = effectivePrice;
                                bestRoom = r;
                                bestDiscountRate = priceInfo.getDiscountRate() != null ? priceInfo.getDiscountRate() : 0;
                                bestOriginalPrice = r.getHourBaseUprice();
                            }
                        }

                        if (bestRoom != null && minEffectivePrice != Integer.MAX_VALUE) {
                            lowestPrice = minEffectivePrice;
                            if (bestDiscountRate > 0 && bestOriginalPrice != null && bestOriginalPrice > lowestPrice) {
                                originalLowestPrice = bestOriginalPrice;
                                discountRate = bestDiscountRate;
                            }
                        }

                        List<String> roomNames = activeRooms.stream()
                                .map(BnRoom::getRoomNm)
                                .filter(name -> name != null && !name.isBlank())
                                .collect(Collectors.toList());
                        if (!roomNames.isEmpty()) {
                            roomSummary = String.join(" · ", roomNames) + " 가능";
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to load rooms info for studioNo: {}", s.getStudioNo(), e);
            }

            result.add(StudioDto.builder()
                    .studioNo(s.getStudioNo())
                    .partnerNo(s.getPartnerNo())
                    .studioNm(s.getStudioNm())
                    .address(s.getAddress())
                    .zipcode(s.getZipcode())
                    .bigo(s.getBigo())
                    .studioStatCd(s.getStudioStatCd())
                    .insDtime(s.getInsDtime())
                    .insId(s.getInsId())
                    .updDtime(s.getUpdDtime())
                    .updId(s.getUpdId())
                    .attachments(attachments)
                    .lowestPrice(lowestPrice)
                    .originalLowestPrice(originalLowestPrice)
                    .discountRate(discountRate)
                    .roomSummary(roomSummary)
                    .studioTypeCd(s.getStudioTypeCd())
                    .build());
        }
        return result;
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
        // 룸, 지점, 파트너 상태값 'A' 검증
        BnRoom room = roomRepository.findById(resv.getRoomNo())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 룸입니다."));
        if (!"A".equals(room.getRoomStatCd())) {
            throw new IllegalStateException("현재 이용할 수 없는 룸입니다.");
        }
        BnStudio studio = studioRepository.findById(room.getStudioNo())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 합주실 지점입니다."));
        if (!"A".equals(studio.getStudioStatCd())) {
            throw new IllegalStateException("현재 이용할 수 없는 합주실 지점입니다.");
        }
        BnPartner partner = partnerRepository.findById(studio.getPartnerNo())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 입점사입니다."));
        if (!"A".equals(partner.getPartnerStatCd())) {
            throw new IllegalStateException("승인되지 않은 합주실 입점사입니다.");
        }

        String cleanDate = resv.getUseDate() != null ? resv.getUseDate().replaceAll("[^0-9]", "") : "";
        String cleanStt = resv.getSttTime() != null ? resv.getSttTime().replaceAll("[^0-9]", "") : "";
        String cleanEnd = resv.getEndTime() != null ? resv.getEndTime().replaceAll("[^0-9]", "") : "";

        if (cleanDate.isEmpty() || cleanStt.isEmpty() || cleanEnd.isEmpty()) {
            throw new IllegalArgumentException("예약 날짜와 시간 정보가 올바르지 않습니다.");
        }

        resv.setUseDate(cleanDate);
        resv.setSttTime(cleanStt);
        resv.setEndTime(cleanEnd);

        int reqStt = Integer.parseInt(cleanStt);
        int reqEnd = Integer.parseInt(cleanEnd);

        // 과거 일자 및 오늘 기준 과거 시간대 예약 차단
        LocalDateTime nowDateTime = LocalDateTime.now();
        String todayStr = nowDateTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int currentHhmm = Integer.parseInt(nowDateTime.format(DateTimeFormatter.ofPattern("HHmm")));

        if (cleanDate.compareTo(todayStr) < 0) {
            throw new IllegalStateException("과거 날짜는 예약할 수 없습니다.");
        } else if (cleanDate.equals(todayStr) && reqStt <= currentHhmm) {
            throw new IllegalStateException("현재 시간보다 이전의 시간대는 예약할 수 없습니다.");
        }

        log.info("[createReservation] 중복 검증 시작 - roomNo: {}, date: {}, req: {} ~ {}",
                resv.getRoomNo(), cleanDate, reqStt, reqEnd);

        // 해당 룸 및 날짜의 기존 예약 조회 (하이픈 있거나 없거나 모두 커버할 수 있도록 원본/클린 모두 검사)
        List<BnReservation> existingList = reservationRepository.findByRoomNoAndUseDateOrderBySttTimeAsc(resv.getRoomNo(), cleanDate);
        if (existingList != null && !existingList.isEmpty()) {
            for (BnReservation exist : existingList) {
                String stat = exist.getResvStatFg() != null ? exist.getResvStatFg().toUpperCase() : "";
                if ("CAN".equals(stat) || "REJ".equals(stat)) {
                    continue; // 취소 또는 거절된 예약은 무시
                }

                String existCleanStt = exist.getSttTime() != null ? exist.getSttTime().replaceAll("[^0-9]", "") : "";
                String existCleanEnd = exist.getEndTime() != null ? exist.getEndTime().replaceAll("[^0-9]", "") : "";

                if (existCleanStt.isEmpty() || existCleanEnd.isEmpty()) continue;

                int existStt = Integer.parseInt(existCleanStt);
                int existEnd = Integer.parseInt(existCleanEnd);

                // 겹침 검사: (새 시작 < 기존 종료) AND (새 종료 > 기존 시작)
                if (reqStt < existEnd && reqEnd > existStt) {
                    String timeDisplay = (existCleanStt.length() >= 2 ? existCleanStt.substring(0, 2) : existCleanStt) + ":00 ~ "
                            + (existCleanEnd.length() >= 2 ? existCleanEnd.substring(0, 2) : existCleanEnd) + ":00";
                    log.warn("[createReservation] 중복 예약 차단! existResvNo: {}, existTime: {}", exist.getResvNo(), timeDisplay);
                    throw new IllegalStateException("선택하신 시간대에 이미 다른 예약이 접수되어 있습니다. (" + timeDisplay + ")");
                }
            }
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        resv.setUserId(userId);
        resv.setResvStatFg("REQ");       // 예약 대기
        resv.setPaymentStatFg("WAIT");   // 결제 대기
        resv.setInsDtime(now);
        resv.setInsId(userId);
        resv.setUpdDtime(now);
        resv.setUpdId(userId);

        BnReservation saved = reservationRepository.save(resv);
        log.info("[createReservation] 예약 완료 - resvNo: {}", saved.getResvNo());

        // 파트너에게 예약 알림 발송
        try {
            pushService.sendPush(
                partner.getUserId(),
                "새 예약 신청 알림",
                studio.getStudioNm() + " - " + room.getRoomNm() + " 예약 신청이 접수되었습니다.",
                "/main/partner/manage",
                "RESV_REQ",
                "RESERVATION"
            );
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

    @Transactional
    public void deleteRoom(Long roomNo) {
        long priceCount = roomPriceRepository.countByRoomNo(roomNo);
        if (priceCount > 0) {
            throw new IllegalStateException("해당 룸에 등록된 단가가 " + priceCount + "건 존재합니다. 단가를 먼저 삭제해 주세요.");
        }
        roomAttachmentRepository.deleteByRoomNo(roomNo);
        roomRepository.deleteById(roomNo);
    }

    @Transactional
    public void deleteStudio(Long studioNo) {
        List<BnRoom> rooms = roomRepository.findByStudioNoOrderByInsDtimeDesc(studioNo);
        if (rooms != null && !rooms.isEmpty()) {
            throw new IllegalStateException("해당 지점에 등록된 룸이 " + rooms.size() + "개 존재합니다. 룸을 먼저 삭제해 주세요.");
        }
        studioAttachmentRepository.deleteByStudioNo(studioNo);
        studioRepository.deleteById(studioNo);
    }

    @Transactional(readOnly = true)
    public RoomScheduleDto getRoomSchedule(Long roomNo, String yearMonth) {
        BnRoom room = roomRepository.findById(roomNo).orElse(null);
        if (room == null || !"A".equals(room.getRoomStatCd())) return null;

        BnStudio studio = studioRepository.findById(room.getStudioNo()).orElse(null);
        if (studio == null || !"A".equals(studio.getStudioStatCd())) return null;

        BnPartner partner = null;
        if (studio.getPartnerNo() != null) {
            partner = partnerRepository.findById(studio.getPartnerNo()).orElse(null);
        }
        if (partner == null || !"A".equals(partner.getPartnerStatCd())) return null;

        List<BnRoomPrice> prices = roomPriceRepository.findByRoomNoOrderByDayOfWeekAscSttTimeAsc(roomNo);
        
        List<String> excludeStats = List.of("CAN", "REJ");
        List<BnReservation> reservations = (yearMonth != null && !yearMonth.isEmpty())
                ? reservationRepository.findByRoomNoAndUseDateStartingWithAndResvStatFgNotIn(roomNo, yearMonth, excludeStats)
                : reservationRepository.findByRoomNoAndUseDateStartingWith(roomNo, "");

        return RoomScheduleDto.builder()
                .roomNo(room.getRoomNo())
                .studioNo(room.getStudioNo())
                .roomNm(room.getRoomNm())
                .studioNm(studio.getStudioNm())
                .hourBaseUprice(room.getHourBaseUprice())
                .capacityCnt(room.getCapacityCnt())
                .equipmentInfo(room.getEquipmentInfo())
                .bankNm(partner.getBankNm())
                .accountNo(partner.getAccountNo())
                .accountHolderNm(partner.getAccountHolderNm())
                .prices(prices)
                .reservations(reservations)
                .build();
    }

    // User-facing DTO
    @lombok.Data
    @lombok.Builder
    public static class RoomScheduleDto {
        private Long roomNo;
        private Long studioNo;
        private String roomNm;
        private String studioNm;
        private Integer hourBaseUprice;
        private Integer capacityCnt;
        private String equipmentInfo;
        private String bankNm;
        private String accountNo;
        private String accountHolderNm;
        private List<BnRoomPrice> prices;
        private List<BnReservation> reservations;
    }

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

