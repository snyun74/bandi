package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanGatherSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClanGatherSessionRepository extends JpaRepository<ClanGatherSession, Long> {
    List<ClanGatherSession> findByGatherNo(Long gatherNo);
}
