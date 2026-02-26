package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanMatchRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ClanMatchRoomRepository extends JpaRepository<ClanMatchRoom, Long> {
    List<ClanMatchRoom> findByGatherNo(Long gatherNo);

    @Modifying
    @Query("DELETE FROM ClanMatchRoom r WHERE r.gatherNo = :gatherNo")
    void deleteByGatherNo(@Param("gatherNo") Long gatherNo);
}
