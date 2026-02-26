package com.bandi.backend.repository;

import com.bandi.backend.entity.clan.ClanGather;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClanGatherRepository extends JpaRepository<ClanGather, Long> {
    List<ClanGather> findByCnNoAndGatherStatCd(Long cnNo, String gatherStatCd);

    List<ClanGather> findByCnNoAndGatherProcFg(Long cnNo, String gatherProcFg);

    List<ClanGather> findByCnNoAndGatherProcFgNot(Long cnNo, String gatherProcFg);

    List<ClanGather> findByCnNo(Long cnNo);
}
