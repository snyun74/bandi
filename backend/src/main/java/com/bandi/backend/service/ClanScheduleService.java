package com.bandi.backend.service;

import com.bandi.backend.dto.ClanScheduleDto;
import com.bandi.backend.entity.clan.ClanSchedule;
import com.bandi.backend.repository.ClanScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClanScheduleService {

    private final ClanScheduleRepository clanScheduleRepository;

    public List<ClanScheduleDto> getSchedules(Long clanId, String year, String month) {
        String yearMonth = year + String.format("%02d", Integer.parseInt(month));
        List<ClanSchedule> schedules = clanScheduleRepository.findAllByCnNoAndMonth(clanId, yearMonth);

        return schedules.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ClanScheduleDto createSchedule(ClanScheduleDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        ClanSchedule schedule = new ClanSchedule();
        schedule.setCnNo(dto.getCnNo());
        schedule.setTitle(dto.getTitle());
        schedule.setContent(dto.getContent());
        schedule.setSttDate(dto.getSttDate());
        schedule.setSttTiem(dto.getSttTiem() == null ? "000000" : dto.getSttTiem());
        schedule.setEndDate(dto.getEndDate() == null ? dto.getSttDate() : dto.getEndDate());
        schedule.setEndTime(dto.getEndTime() == null ? "235959" : dto.getEndTime());
        schedule.setAllDayYn(dto.getAllDayYn() == null ? "N" : dto.getAllDayYn());
        schedule.setSchStatCd("A");
        schedule.setInsDtime(currentDateTime);
        schedule.setInsId(dto.getInsId());
        schedule.setUpdDtime(currentDateTime);
        schedule.setUpdId(dto.getInsId());

        ClanSchedule saved = clanScheduleRepository.save(schedule);
        return mapToDto(saved);
    }

    private ClanScheduleDto mapToDto(ClanSchedule entity) {
        return ClanScheduleDto.builder()
                .cnSchNo(entity.getCnSchNo())
                .cnNo(entity.getCnNo())
                .title(entity.getTitle())
                .content(entity.getContent())
                .sttDate(entity.getSttDate())
                .sttTiem(entity.getSttTiem())
                .endDate(entity.getEndDate())
                .endTime(entity.getEndTime())
                .allDayYn(entity.getAllDayYn())
                .schStatCd(entity.getSchStatCd())
                .insId(entity.getInsId())
                .build();
    }

    @Transactional
    public void deleteSchedule(Long scheduleId) {
        clanScheduleRepository.deleteById(scheduleId);
    }
}
