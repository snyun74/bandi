package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanNoticeDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClanNoticeDetailRepository extends JpaRepository<ClanNoticeDetail, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "user" })
    List<ClanNoticeDetail> findByCnNoticeNoOrderByInsDtimeAsc(Long cnNoticeNo);
}
