package com.bandi.backend.controller;

import com.bandi.backend.entity.band.*;
import com.bandi.backend.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/partner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PartnerController {

    private final PartnerService partnerService;

    // --- Application Status ---
    @GetMapping("/status")
    public ResponseEntity<BnPartner> getPartnerStatus(@RequestParam("userId") String userId) {
        BnPartner partner = partnerService.getPartnerStatus(userId);
        return ResponseEntity.ok(partner);
    }

    @PostMapping("/apply")
    public ResponseEntity<BnPartner> applyPartner(@RequestBody BnPartner applyData) {
        BnPartner saved = partnerService.applyPartner(applyData);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/info")
    public ResponseEntity<?> updatePartnerInfo(
            @RequestBody BnPartner updateData,
            @RequestParam("userId") String userId) {
        try {
            BnPartner updated = partnerService.updatePartnerInfo(updateData, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- Studios ---
    @GetMapping("/studios")
    public ResponseEntity<List<BnStudio>> getStudios(@RequestParam("partnerNo") Long partnerNo) {
        return ResponseEntity.ok(partnerService.getStudios(partnerNo));
    }

    @PostMapping("/studios")
    public ResponseEntity<BnStudio> saveStudio(
            @RequestBody BnStudio studio,
            @RequestParam("userId") String userId) {
        return ResponseEntity.ok(partnerService.saveStudio(studio, userId));
    }

    @GetMapping("/studios-with-images")
    public ResponseEntity<List<PartnerService.StudioDto>> getStudiosWithImages(@RequestParam("partnerNo") Long partnerNo) {
        return ResponseEntity.ok(partnerService.getStudiosWithAttachments(partnerNo));
    }

    @PostMapping("/studios-with-images")
    public ResponseEntity<PartnerService.StudioDto> saveStudioWithImages(
            @RequestParam(value = "studioNo", required = false) Long studioNo,
            @RequestParam("partnerNo") Long partnerNo,
            @RequestParam("studioNm") String studioNm,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "zipcode", required = false) String zipcode,
            @RequestParam(value = "bigo", required = false) String bigo,
            @RequestParam(value = "studioTypeCd", defaultValue = "S") String studioTypeCd,
            @RequestParam("userId") String userId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "deleteAttachNos", required = false) List<Long> deleteAttachNos) {

        BnStudio studio = new BnStudio();
        studio.setStudioNo(studioNo);
        studio.setPartnerNo(partnerNo);
        studio.setStudioNm(studioNm);
        studio.setAddress(address);
        studio.setZipcode(zipcode);
        studio.setBigo(bigo);
        studio.setStudioTypeCd(studioTypeCd);

        PartnerService.StudioDto saved = partnerService.saveStudioWithImages(studio, files, deleteAttachNos, userId);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/studios/{studioNo}")
    public ResponseEntity<?> deleteStudio(@PathVariable("studioNo") Long studioNo) {
        try {
            partnerService.deleteStudio(studioNo);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    // --- Rooms ---
    @GetMapping("/rooms")
    public ResponseEntity<List<BnRoom>> getRooms(@RequestParam("studioNo") Long studioNo) {
        return ResponseEntity.ok(partnerService.getRooms(studioNo));
    }

    @PostMapping("/rooms")
    public ResponseEntity<BnRoom> saveRoom(
            @RequestBody BnRoom room,
            @RequestParam("userId") String userId) {
        return ResponseEntity.ok(partnerService.saveRoom(room, userId));
    }

    @GetMapping("/rooms-with-images")
    public ResponseEntity<List<PartnerService.RoomDto>> getRoomsWithImages(@RequestParam("studioNo") Long studioNo) {
        return ResponseEntity.ok(partnerService.getRoomsWithAttachments(studioNo));
    }

    @PostMapping("/rooms-with-images")
    public ResponseEntity<PartnerService.RoomDto> saveRoomWithImages(
            @RequestParam(value = "roomNo", required = false) Long roomNo,
            @RequestParam("studioNo") Long studioNo,
            @RequestParam("roomNm") String roomNm,
            @RequestParam(value = "hourBaseUprice", required = false) Integer hourBaseUprice,
            @RequestParam(value = "capacityCnt", required = false) Integer capacityCnt,
            @RequestParam(value = "equipmentInfo", required = false) String equipmentInfo,
            @RequestParam("userId") String userId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "deleteAttachNos", required = false) List<Long> deleteAttachNos) {

        BnRoom room = new BnRoom();
        room.setRoomNo(roomNo);
        room.setStudioNo(studioNo);
        room.setRoomNm(roomNm);
        room.setHourBaseUprice(hourBaseUprice);
        room.setCapacityCnt(capacityCnt);
        room.setEquipmentInfo(equipmentInfo);

        PartnerService.RoomDto saved = partnerService.saveRoomWithImages(room, files, deleteAttachNos, userId);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/rooms/{roomNo}")
    public ResponseEntity<?> deleteRoom(@PathVariable("roomNo") Long roomNo) {
        try {
            partnerService.deleteRoom(roomNo);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(java.util.Map.of("message", e.getMessage()));
        }
    }


    // --- Prices ---
    @GetMapping("/room-prices")
    public ResponseEntity<List<BnRoomPrice>> getRoomPrices(@RequestParam("roomNo") Long roomNo) {
        return ResponseEntity.ok(partnerService.getRoomPrices(roomNo));
    }

    @PostMapping("/room-prices")
    public ResponseEntity<List<BnRoomPrice>> saveRoomPrices(
            @RequestParam("roomNo") Long roomNo,
            @RequestParam("userId") String userId,
            @RequestBody List<BnRoomPrice> prices) {
        return ResponseEntity.ok(partnerService.saveRoomPrices(roomNo, prices, userId));
    }

    // --- Reservations ---
    @GetMapping("/reservations")
    public ResponseEntity<List<PartnerService.PartnerReservationDto>> getReservationsForPartner(
            @RequestParam("partnerNo") Long partnerNo) {
        return ResponseEntity.ok(partnerService.getReservationsForPartner(partnerNo));
    }

    @PutMapping("/reservations/{resvNo}/status")
    public ResponseEntity<BnReservation> updateReservationStatus(
            @PathVariable("resvNo") Long resvNo,
            @RequestParam("status") String status,
            @RequestParam(value = "rejectBigo", required = false) String rejectBigo,
            @RequestParam("userId") String userId) {
        return ResponseEntity.ok(partnerService.updateReservationStatus(resvNo, status, rejectBigo, userId));
    }
}
