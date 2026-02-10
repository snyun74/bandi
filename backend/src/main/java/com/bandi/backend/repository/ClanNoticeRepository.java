package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClanNoticeRepository extends JpaRepository<ClanNotice, Long> {

    @Query("SELECT n FROM ClanNotice n WHERE n.cnNo = :cnNo AND :currentDate BETWEEN n.stdDate AND n.endDate ORDER BY n.pinYn DESC, n.insDtime DESC")
    List<ClanNotice> findValidNotices(@Param("cnNo") Long cnNo, @Param("currentDate") String currentDate);
}
