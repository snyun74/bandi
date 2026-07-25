package com.bandi.backend.controller;

import com.bandi.backend.entity.band.*;
import com.bandi.backend.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
