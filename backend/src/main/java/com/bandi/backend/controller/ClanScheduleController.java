package com.bandi.backend.controller;

import com.bandi.backend.dto.ClanScheduleDto;
import com.bandi.backend.service.ClanScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/clan/schedule")
@RequiredArgsConstructor
public class ClanScheduleController {

    private final ClanScheduleService clanScheduleService;

    @GetMapping
    public ResponseEntity<List<ClanScheduleDto>> getSchedules(
            @RequestParam Long clanId,
            @RequestParam String year,
            @RequestParam String month) {
        List<ClanScheduleDto> schedules = clanScheduleService.getSchedules(clanId, year, month);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping
    public ResponseEntity<ClanScheduleDto> createSchedule(@RequestBody ClanScheduleDto dto) {
        ClanScheduleDto savedSchedule = clanScheduleService.createSchedule(dto);
        return ResponseEntity.ok(savedSchedule);
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
        clanScheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.ok().build();
    }
}
