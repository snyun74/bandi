package com.bandi.backend.controller;

import com.bandi.backend.dto.QaRequestDto;
import com.bandi.backend.dto.QaResponseDto;
import com.bandi.backend.service.QaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qa")
@RequiredArgsConstructor
public class QaController {

    private final QaService qaService;

    @PostMapping
    public ResponseEntity<?> createQa(@RequestBody QaRequestDto requestDto) {
        Long qaNo = qaService.createQa(requestDto);
        return ResponseEntity.ok(Map.of("qaNo", qaNo, "message", "문의가 등록되었습니다."));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<QaResponseDto>> getUserQas(@PathVariable String userId) {
        List<QaResponseDto> qas = qaService.getUserQas(userId);
        return ResponseEntity.ok(qas);
    }

    @GetMapping("/{qaNo}/answers")
    public ResponseEntity<List<QaResponseDto>> getQaAnswers(@PathVariable Long qaNo) {
        List<QaResponseDto> answers = qaService.getQaAnswers(qaNo);
        return ResponseEntity.ok(answers);
    }
}
