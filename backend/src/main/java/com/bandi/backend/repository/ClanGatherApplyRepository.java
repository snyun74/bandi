package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanGatherApply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClanGatherApplyRepository extends JpaRepository<ClanGatherApply, Long> {
    List<ClanGatherApply> findByGatherNo(Long gatherNo);

    Optional<ClanGatherApply> findByGatherNoAndUserId(Long gatherNo, String userId);

    void deleteByGatherNoAndUserId(Long gatherNo, String userId);
}
