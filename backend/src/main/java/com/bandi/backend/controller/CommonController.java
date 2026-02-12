package com.bandi.backend.controller;

import com.bandi.backend.entity.common.CommDetail;
import com.bandi.backend.repository.CommDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonController {

    private final CommDetailRepository commDetailRepository;

    @GetMapping("/codes/{code}")
    public ResponseEntity<List<CommDetail>> getCommonCodes(@PathVariable String code) {
        List<CommDetail> details = commDetailRepository.findActiveDetailsByCommCd(code);
        return ResponseEntity.ok(details);
    }
}
