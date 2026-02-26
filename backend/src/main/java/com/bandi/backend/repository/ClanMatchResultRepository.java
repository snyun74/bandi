package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanMatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClanMatchResultRepository extends JpaRepository<ClanMatchResult, Long> {
    List<ClanMatchResult> findByGatherNo(Long gatherNo);

    List<ClanMatchResult> findByRoomNo(Long roomNo);

    @Modifying
    @Query("DELETE FROM ClanMatchResult r WHERE r.gatherNo = :gatherNo")
    void deleteByGatherNo(@Param("gatherNo") Long gatherNo);
}
