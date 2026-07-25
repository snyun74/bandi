package com.bandi.backend.controller;

import com.bandi.backend.entity.band.BnPartner;
import com.bandi.backend.service.AdminPartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/partners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminPartnerController {

    private final AdminPartnerService adminPartnerService;

    @GetMapping
    public ResponseEntity<List<BnPartner>> getPendingPartners() {
        return ResponseEntity.ok(adminPartnerService.getPendingPartners());
    }

    @PutMapping("/{partnerNo}/status")
    public ResponseEntity<BnPartner> updatePartnerStatus(
            @PathVariable("partnerNo") Long partnerNo,
            @RequestParam("status") String status,
            @RequestParam("userId") String userId) {
        return ResponseEntity.ok(adminPartnerService.updatePartnerStatus(partnerNo, status, userId));
    }
}
