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
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        if (startDate != null && endDate != null) {
            List<ClanScheduleDto> schedules = clanScheduleService.getSchedulesByRange(clanId, startDate, endDate);
            return ResponseEntity.ok(schedules);
        }
        List<ClanScheduleDto> schedules = clanScheduleService.getSchedules(clanId, year, month);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ClanScheduleDto>> getMySchedules(
            @RequestParam String userId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        List<ClanScheduleDto> schedules = clanScheduleService.getMySchedules(userId, startDate, endDate);
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
