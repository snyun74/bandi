package com.bandi.backend.repository;

import com.bandi.backend.entity.sns.ShortsDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShortsDetailRepository extends JpaRepository<ShortsDetail, Long> {
    List<ShortsDetail> findByShortsNoAndReplyStatCdOrderByShortsReplyNoAsc(Long shortsNo, String replyStatCd);
    long countByShortsNoAndReplyStatCd(Long shortsNo, String replyStatCd);
}
