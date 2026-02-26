package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanGatherWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClanGatherWeightRepository extends JpaRepository<ClanGatherWeight, Long> {
    List<ClanGatherWeight> findByGatherNo(Long gatherNo);
}
