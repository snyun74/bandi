package com.bandi.backend.service;

import com.bandi.backend.entity.common.Notice;
import com.bandi.backend.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    @Transactional(readOnly = true)
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByInsDtimeDesc();
    }

    @Transactional
    public Notice saveNotice(Notice notice, String userId) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        
        if (notice.getNoticeNo() == null) {
            // New Registration
            notice.setInsDtime(currentDateTime);
            notice.setInsId(userId);
            notice.setWriterUserId(userId);
        } else {
            // Update
            Notice existingNotice = noticeRepository.findById(notice.getNoticeNo())
                    .orElseThrow(() -> new RuntimeException("Notice not found: " + notice.getNoticeNo()));
            
            // Check if editable (current date within std_date and end_date)
            String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            if (today.compareTo(existingNotice.getStdDate()) < 0 || today.compareTo(existingNotice.getEndDate()) > 0) {
                throw new RuntimeException("수정 가능한 공지 기간이 아닙니다.");
            }

            notice.setInsDtime(existingNotice.getInsDtime());
            notice.setInsId(existingNotice.getInsId());
            notice.setWriterUserId(existingNotice.getWriterUserId());
        }

        notice.setUpdDtime(currentDateTime);
        notice.setUpdId(userId);

        return noticeRepository.save(notice);
    }

    @Transactional(readOnly = true)
    public Notice getNotice(Long noticeNo) {
        return noticeRepository.findById(noticeNo)
                .orElseThrow(() -> new RuntimeException("Notice not found: " + noticeNo));
    }

    @Transactional(readOnly = true)
    public List<Notice> getActiveNotices() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return noticeRepository.findActiveNotices(today);
    }
}
